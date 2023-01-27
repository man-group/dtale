import moment from 'moment';
import numeral from 'numeral';
import { MultiGridProps } from 'react-virtualized';

import { InstanceSettings, PredefinedFilterValue, SortDef, ThemeType } from '../redux/state/AppState';
import { truncate } from '../stringUtils';

import { Bounds, ColumnDef, DataRecord, DataViewerData, StringColumnFormat } from './DataViewerState';
import { measureText } from './MeasureText';
import * as menuFuncs from './menu/dataViewerMenuUtils';

export const IDX = 'dtale_index';
export const DEFAULT_COL_WIDTH = 70;

numeral.nullFormat('');

const startswithOne = (value: string, values: string[]): boolean =>
  values.find((s) => value.startsWith(s)) !== undefined;
export const isStringCol = (dtype?: string): boolean =>
  startswithOne((dtype ?? '').toLowerCase(), ['string', 'object', 'unicode']);
export const isIntCol = (dtype?: string): boolean => startswithOne((dtype ?? '').toLowerCase(), ['int', 'uint']);
export const isFloatCol = (dtype?: string): boolean => (dtype ?? '').toLowerCase().startsWith('float');
export const isDateCol = (dtype?: string): boolean =>
  startswithOne((dtype ?? '').toLowerCase(), ['timestamp', 'datetime']);
export const isBoolCol = (dtype?: string): boolean => (dtype ?? '').toLowerCase().startsWith('bool');
export const isCategoryCol = (dtype?: string): boolean => (dtype ?? '').toLowerCase().startsWith('category');
export const getDtype = (col: string | undefined, columns: ColumnDef[]): string | undefined =>
  columns.find(({ name }) => name === col)?.dtype;

/** Condensed column data types */
export enum ColumnType {
  STRING = 'string',
  INT = 'int',
  FLOAT = 'float',
  DATE = 'date',
  BOOL = 'bool',
  CATEGORY = 'category',
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
  } else if (isBoolCol(dtype)) {
    return ColumnType.BOOL;
  } else if (isCategoryCol(dtype)) {
    return ColumnType.CATEGORY;
  }
  return ColumnType.UNKNOWN;
};

const buildNumeral = (val: string | number | boolean, fmt: string, nanDisplay?: string): string =>
  ['nan', 'inf', '-', '', nanDisplay].includes(`${val}`) ? `${val}` : numeral(val).format(fmt);
const buildString = (val: string | number | boolean, cfg?: StringColumnFormat): string =>
  cfg?.truncate ? truncate(`${val}`, cfg.truncate) : `${val}`;

const buildValue = (
  colCfg: ColumnDef | undefined,
  rawValue?: string | number | boolean,
  settings?: InstanceSettings,
): string => {
  if (rawValue !== undefined) {
    const fmt = settings?.columnFormats?.[colCfg?.name ?? '']?.fmt;
    switch (findColType(colCfg?.dtype)) {
      case ColumnType.FLOAT:
        return buildNumeral(
          rawValue,
          (fmt as string) ?? `0.${'0'.repeat(settings?.precision ?? 2)}`,
          settings?.nanDisplay,
        );
      case ColumnType.INT:
        return buildNumeral(rawValue, (fmt as string) ?? '0', settings?.nanDisplay);
      case ColumnType.DATE:
        return fmt ? moment(new Date(`${rawValue}`)).format(fmt as string) : `${rawValue}`;
      case ColumnType.STRING:
      default:
        return buildString(rawValue, fmt as StringColumnFormat);
    }
  }
  return '';
};

export const buildDataProps = (
  colCfg: ColumnDef | undefined,
  rawValue?: string | number | boolean,
  settings?: InstanceSettings,
): DataRecord => ({
  raw: rawValue,
  view: buildValue(colCfg, rawValue, settings),
  style: menuFuncs.buildStyling(
    rawValue,
    findColType(colCfg?.dtype),
    settings?.columnFormats?.[colCfg?.name ?? '']?.style ?? {},
  ),
});

const getHeatActive = (column: ColumnDef): boolean =>
  (column.hasOwnProperty('min') || column.name === IDX) && column.visible === true;

export const heatmapActive = (backgroundMode?: string): boolean =>
  ['heatmap-col', 'heatmap-all'].includes(backgroundMode ?? '');
export const heatmapAllActive = (backgroundMode?: string): boolean =>
  ['heatmap-col-all', 'heatmap-all-all'].includes(backgroundMode ?? '');

export const getActiveCols = (columns: ColumnDef[], backgroundMode?: string): ColumnDef[] =>
  columns?.filter((c) => (heatmapActive(backgroundMode) ? getHeatActive(c) : c.visible ?? false)) ?? [];

export const getCol = (index: number, columns: ColumnDef[], backgroundMode?: string): ColumnDef | undefined =>
  getActiveCols(columns, backgroundMode)[index];

export const getColWidth = (
  index: number,
  columns: ColumnDef[],
  backgroundMode?: string,
  verticalHeaders = false,
): number => {
  const col = getCol(index, columns, backgroundMode);
  let width = col?.width;
  if (verticalHeaders) {
    width = col?.resized ? width : col?.dataWidth ?? width;
  }
  return width ?? DEFAULT_COL_WIDTH;
};

export const ROW_HEIGHT = 25;
export const HEADER_HEIGHT = 35;

export const getRowHeight = (
  index: number,
  columns: ColumnDef[],
  backgroundMode: string | undefined,
  maxRowHeight: number | undefined,
  verticalHeaders = false,
): number => {
  if (index === 0) {
    if (verticalHeaders) {
      const cols = getActiveCols(columns, backgroundMode);
      const maxWidth = Math.max(...cols.map((col) => col.headerWidth ?? col.width ?? HEADER_HEIGHT));
      return maxWidth < HEADER_HEIGHT ? HEADER_HEIGHT : maxWidth;
    }
    return HEADER_HEIGHT;
  }
  return maxRowHeight ?? ROW_HEIGHT;
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
      (b[col]?.view?.length ?? 0) - (a[col]?.view?.length ?? 0),
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

export const calcColWidth = (
  colCfg: ColumnDef,
  data: DataViewerData,
  rowCount: number,
  sortInfo?: SortDef[],
  backgroundMode?: string,
  maxColumnWidth?: number,
): Partial<ColumnDef> => {
  const { name, dtype, hasMissing, hasOutliers, lowVariance, resized, width, headerWidth, dataWidth } = colCfg;
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

export const isLight = (theme: ThemeType): boolean =>
  ThemeType.LIGHT === theme || !Object.values(ThemeType).includes(theme);

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
  const activeCols: ColumnDef[] = getActiveCols(columns);
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

export const getCell = (cellIdx: string, columns: ColumnDef[], data: DataViewerData, backgroundMode?: string): Cell => {
  const [colIndex, rowIndex] = convertCellIdxToCoords(cellIdx);
  const colCfg = getCol(colIndex, columns, backgroundMode)!;
  const rec = data?.[rowIndex - 1]?.[colCfg.name]!;
  return { colCfg, rec, colIndex, rowIndex };
};

export const gridHeight = (
  height: number,
  columns: ColumnDef[],
  settings: InstanceSettings,
  ribbonMenuOpen: boolean,
  editedTextAreaHeight?: number,
): number => height - (hasNoInfo(settings, columns) ? 3 : 30) - (ribbonMenuOpen ? 25 : 0) - (editedTextAreaHeight ?? 0);

export const updateColWidths = (
  columns: ColumnDef[],
  data: DataViewerData,
  rowCount: number,
  settings: InstanceSettings,
  maxColumnWidth?: number,
): ColumnDef[] => {
  return columns.map((c) => ({
    ...c,
    ...calcColWidth(c, data, rowCount, settings.sortInfo, settings.backgroundMode, maxColumnWidth),
  }));
};

const buildColMap = (columns: ColumnDef[]): Record<string, ColumnDef> =>
  columns.reduce((res, c) => ({ ...res, [c.name]: c }), {});

export const refreshColumns = (
  newColumns: ColumnDef[],
  columns: ColumnDef[],
  data: DataViewerData,
  rowCount: number,
  settings: InstanceSettings,
  maxColumnWidth?: number,
): { columns: ColumnDef[] } & Bounds => {
  const columnMap = buildColMap(columns);
  const newCols = newColumns
    .filter(({ name }) => columnMap[name] === undefined)
    .map((c) => ({
      ...c,
      locked: false,
      ...calcColWidth(c, data, rowCount, settings.sortInfo, settings.backgroundMode, maxColumnWidth),
    }));
  const updatedColumns = buildColMap(newColumns);
  const finalColumns = [
    ...columns.map((c) => (c.dtype !== updatedColumns[c.name].dtype ? { ...c, ...updatedColumns[c.name] } : c)),
    ...newCols,
  ];
  return { columns: finalColumns, ...getTotalRange(finalColumns) };
};

export const range = (start: number, end: number): number[] => [...Array(end - start).keys()].map((i) => i + start);
