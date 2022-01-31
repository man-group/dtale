import moment from 'moment';
import numeral from 'numeral';
import { MultiGridProps } from 'react-virtualized';
import { Dispatch } from 'redux';

import { ActionType, AppActions, ClearDataViewerUpdateAction } from '../redux/actions/AppActions';
import { openChart } from '../redux/actions/charts';
import * as actions from '../redux/actions/dtale';
import { AppState, InstanceSettings, Popups, PredefinedFilterValue, ThemeType } from '../redux/state/AppState';
import { truncate } from '../stringUtils';

import {
  Bounds,
  ColumnDef,
  ColumnFormat,
  DataRecord,
  DataViewerData,
  DataViewerProps,
  DataViewerState,
  StringColumnFormat,
} from './DataViewerState';
import { measureText } from './MeasureText';
import menuFuncs from './menu/dataViewerMenuUtils';
import { buildRangeState } from './rangeSelectUtils';

export const IDX = 'dtale_index';
const DEFAULT_COL_WIDTH = 70;

numeral.nullFormat('');

const startswithOne = (value: string, values: string[]): boolean =>
  values.find((s) => value.startsWith(s)) !== undefined;
export const isStringCol = (dtype?: string): boolean =>
  startswithOne((dtype ?? '').toLowerCase(), ['string', 'object', 'unicode']);
export const isIntCol = (dtype?: string): boolean => startswithOne((dtype ?? '').toLowerCase(), ['int', 'uint']);
export const isFloatCol = (dtype?: string): boolean => (dtype ?? '').toLowerCase().startsWith('float');
export const isDateCol = (dtype?: string): boolean =>
  startswithOne((dtype ?? '').toLowerCase(), ['timestamp', 'datetime']);
export const getDtype = (col: string | undefined, columns: ColumnDef[]): string | undefined =>
  columns.find(({ name }) => name === col)?.dtype;

/** Condensed column data types */
export enum ColumnType {
  STRING = 'string',
  INT = 'int',
  FLOAT = 'float',
  DATE = 'date',
  UNKNOWN = 'unknown',
}

export const findColType = (dtype?: string): ColumnType => {
  if (isStringCol(dtype)) {
    return ColumnType.STRING;
  } else if (isIntCol(dtype)) {
    return ColumnType.INT;
  } else if (isFloatCol(dtype)) {
    return ColumnType.FLOAT;
  } else if (isDateCol(dtype)) {
    return ColumnType.DATE;
  }
  return ColumnType.UNKNOWN;
};

const buildNumeral = (val: string | number, fmt: string, nanDisplay?: string): string =>
  ['nan', 'inf', '-', '', nanDisplay].includes(`${val}`) ? `${val}` : numeral(val).format(fmt);
const buildString = (val: string | number, cfg?: StringColumnFormat): string =>
  cfg?.truncate ? truncate(`${val}`, cfg.truncate) : `${val}`;

const buildValue = (
  colCfg: ColumnDef,
  rawValue?: string | number,
  columnFormats?: Record<string, ColumnFormat>,
  settings?: InstanceSettings,
): string => {
  if (rawValue !== undefined) {
    const fmt = columnFormats?.[colCfg.name]?.fmt;
    switch (findColType(colCfg.dtype)) {
      case ColumnType.FLOAT:
        return buildNumeral(
          rawValue,
          (fmt as string) ?? `0.${'0'.repeat(settings?.precision ?? 2)}`,
          settings?.nanDisplay,
        );
      case ColumnType.INT:
        return buildNumeral(rawValue, (fmt as string) ?? '0', settings?.nanDisplay);
      case ColumnType.DATE:
        return fmt ? moment(new Date(rawValue)).format(fmt as string) : `${rawValue}`;
      case ColumnType.STRING:
      default:
        return buildString(rawValue, fmt as StringColumnFormat);
    }
  }
  return '';
};

export const buildDataProps = (
  colCfg: ColumnDef,
  rawValue?: string | number,
  columnFormats?: Record<string, ColumnFormat>,
  settings?: InstanceSettings,
): DataRecord => ({
  raw: rawValue,
  view: buildValue(colCfg, rawValue, columnFormats, settings),
  style: menuFuncs.buildStyling(rawValue, findColType(colCfg.dtype), columnFormats?.[colCfg.name]?.style ?? {}),
});

const getHeatActive = (column: ColumnDef): boolean =>
  (column.hasOwnProperty('min') || column.name === IDX) && column.visible === true;

export const heatmapActive = (backgroundMode?: string): boolean =>
  ['heatmap-col', 'heatmap-all'].includes(backgroundMode ?? '');
export const heatmapAllActive = (backgroundMode?: string): boolean =>
  ['heatmap-col-all', 'heatmap-all-all'].includes(backgroundMode ?? '');

export const getActiveCols = (state: Partial<DataViewerState>): ColumnDef[] =>
  state.columns?.filter((c) => (heatmapActive(state.backgroundMode) ? getHeatActive(c) : c.visible ?? false)) ?? [];

export const getCol = (index: number, state: Partial<DataViewerState>): ColumnDef | undefined =>
  getActiveCols(state)[index];

export const getColWidth = (index: number, state: Partial<DataViewerState>, props: DataViewerProps): number => {
  const col = getCol(index, state);
  let width = col?.width;
  if (props.verticalHeaders) {
    width = col?.resized ? width : col?.dataWidth ?? width;
  }
  return width ?? DEFAULT_COL_WIDTH;
};

export const ROW_HEIGHT = 25;
export const HEADER_HEIGHT = 35;

export const getRowHeight = (index: number, state: Partial<DataViewerState>, props: DataViewerProps): number => {
  if (index === 0) {
    if (props.verticalHeaders) {
      const cols = getActiveCols(state);
      const maxWidth = Math.max(...cols.map((col) => col.headerWidth ?? col.width ?? HEADER_HEIGHT));
      return maxWidth < HEADER_HEIGHT ? HEADER_HEIGHT : maxWidth;
    }
    return HEADER_HEIGHT;
  }
  return props.maxRowHeight ?? ROW_HEIGHT;
};

export const getRanges = (array: number[]): string[] => {
  const ranges = [];
  let rstart;
  let rend;
  for (let i = 0; i < array.length; i++) {
    rstart = array[i];
    rend = rstart;
    while (array[i + 1] - array[i] === 1) {
      rend = array[i + 1]; // increment the index if the numbers sequential
      i++;
    }
    ranges.push(rstart === rend ? `${rstart}` : `${rstart}-${rend}`);
  }
  return ranges;
};

const getMaxLengthStr = (col: string, data?: DataViewerData): string =>
  Object.values(data ?? {}).sort(
    (a: Record<string, DataRecord>, b: Record<string, DataRecord>) =>
      (a[col]?.view?.length ?? 0) - (b[col]?.view?.length ?? 0),
  )[0]?.[col]?.view ?? '';

const calcDataWidth = (name: string, dtype: string, data?: DataViewerData): number | undefined => {
  switch (findColType(dtype)) {
    case ColumnType.DATE:
      return measureText(getMaxLengthStr(name, data).replace(new RegExp('[0-9]', 'g'), '0')); // zero is widest number
    case ColumnType.INT:
    case ColumnType.FLOAT: {
      return measureText(getMaxLengthStr(name, data));
    }
    case ColumnType.STRING:
    default: {
      const upperWords = [...new Set(Object.values(data ?? {}).map((d) => (d[name]?.view ?? '').toUpperCase()))];
      return upperWords.length ? Math.max(...upperWords.map(measureText)) : undefined;
    }
  }
};

export const calcColWidth = (colCfg: ColumnDef, dataProps: Partial<DataViewerState>): Partial<ColumnDef> => {
  const { name, dtype, hasMissing, hasOutliers, lowVariance, resized, width, headerWidth, dataWidth } = colCfg;
  const { data, rowCount, sortInfo, backgroundMode, maxColumnWidth } = dataProps;
  if (resized === true) {
    return { width, headerWidth, dataWidth };
  }
  let w;
  if (name === IDX) {
    w = measureText(`${(rowCount ?? 1) - 1}`);
    w = w < DEFAULT_COL_WIDTH ? DEFAULT_COL_WIDTH : w;
    return { width: w, headerWidth: w, dataWidth: w };
  } else {
    const sortDir = ((sortInfo ?? []).find(([col, _dir]) => col === name) || [null, null])[1];
    let updatedHeaderWidth = measureText(name) + (sortDir ? 10 : 0);
    if (backgroundMode === 'missing' && hasMissing) {
      updatedHeaderWidth += 10; // "!" emoji
    } else if (backgroundMode === 'outliers' && hasOutliers) {
      updatedHeaderWidth += 15; // star emoji
    } else if (backgroundMode === 'lowVariance' && lowVariance) {
      updatedHeaderWidth += 15; // star emoji
    }
    const updatedDataWidth = calcDataWidth(name, dtype, data) ?? DEFAULT_COL_WIDTH;
    w = updatedHeaderWidth > updatedDataWidth ? updatedHeaderWidth : updatedDataWidth;
    w = maxColumnWidth && w >= maxColumnWidth ? { width: maxColumnWidth, resized: true } : { width: w };
    w = { ...w, headerWidth: updatedHeaderWidth, dataWidth: updatedDataWidth };
  }
  return w;
};

export const THEMES = Object.values(ThemeType);

export const isLight = (theme: ThemeType): boolean => ThemeType.LIGHT === theme || !THEMES.includes(theme);

export const buildGridStyles = (theme = ThemeType.LIGHT, headerHeight = HEADER_HEIGHT): Partial<MultiGridProps> => ({
  style: { border: '1px solid #ddd' },
  styleBottomLeftGrid: {
    borderRight: '2px solid #aaa',
    backgroundColor: isLight(theme) ? '#f7f7f7' : 'inherit',
  },
  styleTopLeftGrid: {
    height: headerHeight,
    borderBottom: '2px solid #aaa',
    borderRight: '2px solid #aaa',
    fontWeight: 'bold',
  },
  styleTopRightGrid: {
    height: headerHeight + 15,
    borderBottom: '2px solid #aaa',
    fontWeight: 'bold',
  },
  enableFixedColumnScroll: true,
  enableFixedRowScroll: true,
  hideTopRightGridScrollbar: true,
  hideBottomLeftGridScrollbar: true,
});

export const getTotalRange = (columns: ColumnDef[]): Bounds => {
  const activeCols: ColumnDef[] = getActiveCols({ columns });
  const mins: number[] = [];
  const maxs: number[] = [];
  activeCols.forEach((col) => {
    if (col.min !== undefined) {
      mins.push(col.min);
    }
    if (col.max !== undefined) {
      maxs.push(col.max);
    }
  });
  return { min: !!mins.length ? Math.min(...mins) : undefined, max: !!maxs.length ? Math.max(...maxs) : undefined };
};

const loadBackgroundMode = (props: DataViewerProps): string | undefined =>
  props.settings.backgroundMode ?? !!props.settings.rangeHighlight?.length ? 'range' : undefined;

export const buildState = (props: DataViewerProps): DataViewerState => ({
  ...buildGridStyles(props.theme),
  columnFormats: props.settings.columnFormats ?? {},
  nanDisplay: props.settings.nanDisplay,
  overscanColumnCount: 0,
  overscanRowCount: 5,
  rowCount: 0,
  fixedColumnCount: (props.settings.locked ?? []).length + 1, // add 1 for IDX column
  fixedRowCount: 1,
  data: {},
  loading: false,
  ids: [0, 55],
  loadQueue: [],
  columns: [],
  selectedCols: [],
  menuOpen: false,
  formattingOpen: false,
  triggerResize: false,
  backgroundMode: loadBackgroundMode(props),
  rangeHighlight: props.settings.rangeHighlight ?? {},
  ...buildRangeState(),
});

export const noHidden = (columns: ColumnDef[]): boolean => columns.find(({ visible }) => !visible) === undefined;

export const predefinedHasValue = (value: PredefinedFilterValue): boolean =>
  Array.isArray(value.value) ? !!value.value.length : value?.value !== undefined;
export const filterPredefined = (
  filters?: Record<string, PredefinedFilterValue>,
): Record<string, PredefinedFilterValue> =>
  filters
    ? Object.keys(filters).reduce(
        (res, key) => (filters[key].active && predefinedHasValue(filters[key]) ? { ...res, [key]: filters[key] } : res),
        {},
      )
    : {};
export const noFilters = (state: Partial<InstanceSettings>): boolean =>
  !state.query &&
  !Object.keys(state.columnFilters ?? {}).length &&
  !Object.keys(state.outlierFilters ?? {}).length &&
  !Object.keys(filterPredefined(state.predefinedFilters ?? {})).length;

export const hasNoInfo = (settings: Partial<InstanceSettings>, columns: ColumnDef[]): boolean =>
  !settings.sortInfo?.length && noFilters(settings) && noHidden(columns);

export const convertCellIdxToCoords = (cellIdx: string): number[] =>
  (cellIdx ?? '').split('|').map((v) => parseInt(v, 10));

/** Properties associated w/ a cell in the data grid */
interface Cell {
  colCfg: ColumnDef;
  rec: DataRecord;
  colIndex: number;
  rowIndex: number;
}

export const getCell = (cellIdx: string, gridState: Partial<DataViewerState>): Cell => {
  const [colIndex, rowIndex] = convertCellIdxToCoords(cellIdx);
  const colCfg = getCol(colIndex, gridState)!;
  const rec = gridState.data?.[rowIndex - 1]?.[colCfg.name]!;
  return { colCfg, rec, colIndex, rowIndex };
};

export const gridHeight = (height: number, columns: ColumnDef[], props: DataViewerProps): number =>
  height -
  (hasNoInfo(props.settings, columns) ? 3 : 30) -
  (props.ribbonMenuOpen ? 25 : 0) -
  (props.editedTextAreaHeight ?? 0);

export const updateColWidths = (
  currState: DataViewerState,
  newState: Partial<DataViewerState>,
  settings: InstanceSettings,
  maxColumnWidth: number,
): ColumnDef[] =>
  (newState.columns ?? currState.columns).map((c) => ({
    ...c,
    ...calcColWidth(c, { ...currState, ...newState, ...settings, maxColumnWidth }),
  }));

const buildColMap = (columns: ColumnDef[]): Record<string, ColumnDef> =>
  columns.reduce((res, c) => ({ ...res, [c.name]: c }), {});

export const refreshColumns = (
  newColumns: ColumnDef[],
  columns: ColumnDef[],
  state: DataViewerState,
  settings: InstanceSettings,
  maxColumnWidth: number,
): DataViewerState => {
  const columnMap = buildColMap(columns);
  const newCols = newColumns
    .filter(({ name }) => columnMap[name] === undefined)
    .map((c) => ({ ...c, locked: false, ...calcColWidth(c, { ...state, ...settings, maxColumnWidth }) }));
  const updatedColumns = buildColMap(newColumns);
  const finalColumns = [
    ...columns.map((c) => (c.dtype !== updatedColumns[c.name].dtype ? { ...c, ...updatedColumns[c.name] } : c)),
    ...newCols,
  ];
  return { ...state, columns: finalColumns, ...getTotalRange(finalColumns) };
};

export const reduxState = (state: AppState): Partial<DataViewerProps> => ({
  dataId: state.dataId,
  iframe: state.iframe,
  theme: state.theme,
  settings: state.settings,
  menuPinned: state.menuPinned,
  ribbonMenuOpen: state.ribbonMenuOpen,
  dataViewerUpdate: state.dataViewerUpdate || undefined,
  maxColumnWidth: state.maxColumnWidth || undefined,
  maxRowHeight: state.maxRowHeight || undefined,
  editedTextAreaHeight: state.editedTextAreaHeight,
  verticalHeaders: state.settings.verticalHeaders ?? false,
});

export const reduxDispatch = (dispatch: Dispatch<any>): Partial<DataViewerProps> => ({
  closeColumnMenu: (): AppActions<void> => dispatch(actions.closeColumnMenu()),
  openChart: (chartProps: Popups): AppActions<void> => dispatch(openChart(chartProps)),
  updateFilteredRanges: (query: string): AppActions<Promise<void>> => dispatch(actions.updateFilteredRanges(query)),
  clearDataViewerUpdate: (): ClearDataViewerUpdateAction => dispatch({ type: ActionType.CLEAR_DATA_VIEWER_UPDATE }),
});
