import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  AutoSizer as _AutoSizer,
  MultiGrid as _MultiGrid,
  AutoSizerProps,
  GridCellProps,
  MultiGridProps,
} from 'react-virtualized';
import { AnyAction } from 'redux';

import { usePrevious } from '../../customHooks';
import * as actions from '../../redux/actions/dtale';
import { AppState } from '../../redux/state/AppState';
import { DataResponseContent } from '../../repository/DataRepository';
import * as bu from '../backgroundUtils';
import { ColumnDef, DataViewerData, PropagatedState } from '../DataViewerState';
import * as gu from '../gridUtils';
import DataViewerInfo from '../info/DataViewerInfo';
import { MeasureText } from '../MeasureText';

import GridCell from './GridCell';

require('../DataViewer.css');

const AutoSizer = _AutoSizer as unknown as React.FC<AutoSizerProps>;
const MultiGrid = _MultiGrid as unknown as React.FC<MultiGridProps>;

/** Component properties for ServerlessDataViewer */
interface ServerlessDataViewerProps {
  response: DataResponseContent;
}

export const ServerlessDataViewer: React.FC<ServerlessDataViewerProps> = ({ response }) => {
  const {
    theme,
    settings,
    menuPinned,
    ribbonMenuOpen,
    maxColumnWidth,
    maxRowHeight,
    editedTextAreaHeight,
    verticalHeaders,
  } = useSelector((state: AppState) => ({
    theme: state.theme,
    settings: state.settings,
    menuPinned: state.menuPinned,
    ribbonMenuOpen: state.ribbonMenuOpen,
    maxColumnWidth: state.maxColumnWidth || undefined,
    maxRowHeight: state.maxRowHeight || undefined,
    editedTextAreaHeight: state.editedTextAreaHeight,
    verticalHeaders: state.settings.verticalHeaders ?? false,
  }));
  const dispatch = useDispatch();
  const updateFilteredRanges = (query: string): AnyAction =>
    dispatch(actions.updateFilteredRanges(query) as any as AnyAction);

  const [rowCount, setRowCount] = React.useState(0);
  const [fixedColumnCount, setFixedColumnCount] = React.useState((settings.locked ?? []).length + 1); // add 1 for IDX column
  const [data, setData] = React.useState<DataViewerData>({});
  const [columns, setColumns] = React.useState<ColumnDef[]>([]);
  const [triggerResize, setTriggerResize] = React.useState(false);
  const [min, setMin] = React.useState<number>();
  const [max, setMax] = React.useState<number>();

  const gridRef = React.useRef<_MultiGrid>(null);

  const getData = (): void => {
    if (response) {
      const formattedData = Object.keys(response.results).reduce(
        (res, rowIdx) => ({
          ...res,
          [rowIdx]: Object.keys(response.results[Number(rowIdx)]).reduce(
            (res2, col) => ({
              ...res2,
              [col]: gu.buildDataProps(
                response.columns.find(({ name }) => name === col)!,
                response.results[Number(rowIdx)][col],
                settings,
              ),
            }),
            {},
          ),
        }),
        {} as DataViewerData,
      );
      updateFilteredRanges(response.final_query);
      const updatedRowCount = Object.keys(response.results).length + 1;
      const updatedData: DataViewerData = { ...formattedData };
      let updatedColumns = [...columns];
      updatedColumns = response.columns.map((c: ColumnDef) => ({
        ...c,
        locked: c.name === gu.IDX || (settings?.locked ?? []).includes(c.name),
        ...gu.calcColWidth(c, updatedData, updatedRowCount, settings.sortInfo, settings.backgroundMode, maxColumnWidth),
      }));
      if (settings.backgroundMode === 'outliers') {
        updatedColumns = updatedColumns.map(bu.buildOutlierScales);
      }
      const bounds = gu.getTotalRange(updatedColumns);
      setMin(bounds.min);
      setMax(bounds.max);
      setData(updatedData);
      setRowCount(updatedRowCount);
      setColumns(
        updatedColumns.map((c) => ({
          ...c,
          ...gu.calcColWidth(
            c,
            updatedData,
            updatedRowCount,
            settings.sortInfo,
            settings.backgroundMode,
            maxColumnWidth,
          ),
        })),
      );
      setTriggerResize(verticalHeaders);
    }
  };

  React.useEffect(() => getData(), []);

  // const previousBackgroundMode = usePrevious(settings.backgroundMode);
  const previousSettings = usePrevious(settings);

  React.useEffect(() => {
    const refresh = previousSettings && JSON.stringify(settings) !== JSON.stringify(previousSettings);
    if (refresh) {
      setTriggerResize(true);
    }
  }, [settings]);

  // React.useEffect(() => {
  //   let updatedColumns = gu.updateColWidths(columns, data, rowCount, settings, maxColumnWidth);
  //   if (settings.backgroundMode === 'outliers') {
  //     updatedColumns = updatedColumns.map(bu.buildOutlierScales);
  //   }
  //   setColumns(updatedColumns);
  //   setTriggerResize(
  //     bu.RESIZABLE.includes(settings.backgroundMode ?? '') || bu.RESIZABLE.includes(previousBackgroundMode ?? ''),
  //   );
  // }, [settings.backgroundMode]);

  const resizeGrid = (): void => {
    gridRef.current?.forceUpdate();
    gridRef.current?.recomputeGridSize();
  };

  React.useEffect(() => {
    if (triggerResize) {
      setTriggerResize(false);
      if (Object.keys(data).length) {
        resizeGrid();
      }
    }
  }, [triggerResize]);

  const propagateState = (state: Partial<PropagatedState>, callback?: () => void): void => {
    let finalState = { ...state };
    if (state.hasOwnProperty('columns') && state.formattingUpdate !== true) {
      finalState.columns = gu.updateColWidths(
        state.columns ?? columns,
        state.data ?? data,
        state.rowCount ?? rowCount,
        settings,
        maxColumnWidth,
      );
      finalState = { ...finalState, ...gu.getTotalRange(finalState.columns) };
    }
    setData(finalState.data ?? data);
    setColumns(finalState.columns ?? columns);
    setRowCount(finalState.rowCount ?? rowCount);
    setFixedColumnCount(finalState.fixedColumnCount ?? fixedColumnCount);
    setTriggerResize(finalState.triggerResize ?? triggerResize);
    callback?.();
  };

  const cellRenderer = (props: GridCellProps): React.ReactNode => {
    const { columnIndex, key, rowIndex, style } = props;
    return <GridCell {...{ columnIndex, key, rowIndex, style, data, columns, min, max, rowCount, propagateState }} />;
  };

  return (
    <React.Fragment>
      <AutoSizer className="main-grid col p-0" onResize={() => gridRef.current?.recomputeGridSize()}>
        {({ width, height }) => (
          <>
            <DataViewerInfo columns={columns} propagateState={propagateState} />
            <MultiGrid
              {...gu.buildGridStyles(
                theme,
                gu.getRowHeight(0, columns, settings.backgroundMode, maxRowHeight, verticalHeaders),
              )}
              overscanColumnCount={0}
              overscanRowCount={5}
              fixedRowCount={1}
              fixedColumnCount={fixedColumnCount}
              rowCount={rowCount}
              columnCount={gu.getActiveCols(columns, settings.backgroundMode).length}
              cellRenderer={cellRenderer}
              height={gu.gridHeight(height, columns, settings, ribbonMenuOpen, editedTextAreaHeight)}
              width={width - (menuPinned ? 198 : 3)}
              columnWidth={({ index }) => gu.getColWidth(index, columns, settings.backgroundMode, verticalHeaders)}
              rowHeight={({ index }) =>
                gu.getRowHeight(index, columns, settings.backgroundMode, maxRowHeight, verticalHeaders)
              }
              ref={gridRef}
            />
          </>
        )}
      </AutoSizer>
      <MeasureText />
    </React.Fragment>
  );
};
