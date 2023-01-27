import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  AutoSizer as _AutoSizer,
  InfiniteLoader as _InfiniteLoader,
  MultiGrid as _MultiGrid,
  AutoSizerProps,
  GridCellProps,
  IndexRange,
  InfiniteLoaderProps,
  MultiGridProps,
  SectionRenderedParams,
} from 'react-virtualized';
import { AnyAction } from 'redux';

import { usePrevious } from '../customHooks';
import Formatting from '../popups/formats/Formatting';
import Popup from '../popups/Popup';
import { ActionType, ClearDataViewerUpdateAction } from '../redux/actions/AppActions';
import * as actions from '../redux/actions/dtale';
import { buildURLParams } from '../redux/actions/url-utils';
import { AppState } from '../redux/state/AppState';
import { RemovableError } from '../RemovableError';
import * as DataRepository from '../repository/DataRepository';

import * as bu from './backgroundUtils';
import ColumnMenu from './column/ColumnMenu';
import { ColumnDef, DataViewerData, PropagatedState } from './DataViewerState';
import { DtaleHotkeys } from './DtaleHotkeys';
import EditedCellInfo from './edited/EditedCellInfo';
import GridCell from './GridCell';
import GridEventHandler from './GridEventHandler';
import * as gu from './gridUtils';
import DataViewerInfo from './info/DataViewerInfo';
import DataViewerMenu from './menu/DataViewerMenu';
import * as reduxUtils from './reduxGridUtils';
import RibbonDropdown from './ribbon/RibbonDropdown';
import RibbonMenu from './ribbon/RibbonMenu';

require('./DataViewer.css');

const AutoSizer = _AutoSizer as unknown as React.FC<AutoSizerProps>;
const InfiniteLoader = _InfiniteLoader as unknown as React.FC<InfiniteLoaderProps>;
const MultiGrid = _MultiGrid as unknown as React.FC<MultiGridProps>;

export const DataViewer: React.FC = () => {
  const {
    dataId,
    theme,
    settings,
    menuPinned,
    ribbonMenuOpen,
    dataViewerUpdate,
    maxColumnWidth,
    maxRowHeight,
    editedTextAreaHeight,
    verticalHeaders,
  } = useSelector((state: AppState) => ({
    dataId: state.dataId,
    theme: state.theme,
    settings: state.settings,
    menuPinned: state.menuPinned,
    ribbonMenuOpen: state.ribbonMenuOpen,
    dataViewerUpdate: state.dataViewerUpdate,
    maxColumnWidth: state.maxColumnWidth || undefined,
    maxRowHeight: state.maxRowHeight || undefined,
    editedTextAreaHeight: state.editedTextAreaHeight,
    verticalHeaders: state.settings.verticalHeaders ?? false,
  }));
  const dispatch = useDispatch();
  const closeColumnMenu = (): AnyAction => dispatch(actions.closeColumnMenu() as any as AnyAction);
  const updateFilteredRanges = (query: string): AnyAction =>
    dispatch(actions.updateFilteredRanges(query) as any as AnyAction);
  const clearDataViewerUpdate = (): ClearDataViewerUpdateAction =>
    dispatch({ type: ActionType.CLEAR_DATA_VIEWER_UPDATE });

  const [rowCount, setRowCount] = React.useState(0);
  const [fixedColumnCount, setFixedColumnCount] = React.useState((settings.locked ?? []).length + 1); // add 1 for IDX column
  const [data, setData] = React.useState<DataViewerData>({});
  const [loading, setLoading] = React.useState(false);
  const [ids, setIds] = React.useState<number[]>([0, 55]);
  const [loadQueue, setLoadQueue] = React.useState<number[][]>([]);
  const [columns, setColumns] = React.useState<ColumnDef[]>([]);
  const [triggerResize, setTriggerResize] = React.useState(false);
  const [min, setMin] = React.useState<number>();
  const [max, setMax] = React.useState<number>();
  const [error, setError] = React.useState<JSX.Element>();

  const gridRef = React.useRef<_MultiGrid>(null);
  const onRowsRendered = React.useRef<{ func?: (params: IndexRange) => void }>({});

  const getData = (updatedIds: number[], refresh = false): void => {
    if (loading) {
      setLoadQueue([...loadQueue, updatedIds]);
      return;
    }
    setLoading(true);
    setIds(updatedIds);
    let newIds = [`${updatedIds[0]}-${updatedIds[1]}`];
    let savedData = {};
    if (!refresh) {
      newIds = gu.getRanges(gu.range(updatedIds[0], updatedIds[1] + 1).filter((i) => !data.hasOwnProperty(i)));
      savedData = Object.keys(data).reduce((res, key) => {
        if (Number(key) >= updatedIds[0] && Number(key) <= updatedIds[1] + 1) {
          return { ...res, [Number(key)]: data[Number(key)] };
        }
        return res;
      }, {} as DataViewerData);
      // Make sure we check to see if the data we are saving is the actual data being displayed by the grid
      const currGrid = (gridRef.current as any)._bottomRightGrid;
      if (currGrid) {
        const currGridData = Object.keys(data).reduce((res, key) => {
          if (Number(key) >= currGrid._renderedRowStartIndex && Number(key) <= currGrid._renderedRowEndIndex) {
            return { ...res, [Number(key)]: data[Number(key)] };
          }
          return res;
        }, {} as DataViewerData);
        savedData = { ...savedData, ...currGridData };
      }
    }
    if (!newIds.length) {
      setLoading(false);
      return;
    }
    const params = buildURLParams({ ids: newIds, sortInfo: settings.sortInfo }, ['ids', 'sortInfo']);
    if (!Object.keys(params).length) {
      console.log(['Empty params!', { ids, newIds, data }]); // eslint-disable-line no-console
      setLoading(false);
      return; // I've seen issues with react-virtualized where it will get into this method without parameters
    }
    DataRepository.load(dataId, params).then((response) => {
      if (response?.error) {
        setError(<RemovableError {...response} onRemove={() => setError(undefined)} />);
        setLoading(false);
        return;
      }
      if (response) {
        const formattedData = Object.keys(response.results).reduce(
          (res, rowIdx) => ({
            ...res,
            [rowIdx]: Object.keys(response.results[Number(rowIdx)]).reduce(
              (res2, col) => ({
                ...res2,
                [col]: gu.buildDataProps(
                  response.columns.find(({ name }) => name === col),
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
        const updatedRowCount = response.total + 1;
        const updatedData: DataViewerData = { ...savedData, ...formattedData };
        setError(undefined);
        setLoading(false);
        let updatedColumns = [...columns];
        let updatedTriggerResize: boolean | undefined;
        if (!columns.length) {
          updatedColumns = response.columns.map((c: ColumnDef) => ({
            ...c,
            locked: c.name === gu.IDX || (settings?.locked ?? []).includes(c.name),
            ...gu.calcColWidth(
              c,
              updatedData,
              updatedRowCount,
              settings.sortInfo,
              settings.backgroundMode,
              maxColumnWidth,
            ),
          }));
          updatedTriggerResize = verticalHeaders;
          if (settings.backgroundMode === 'outliers') {
            updatedColumns = updatedColumns.map(bu.buildOutlierScales);
          }
          const bounds = gu.getTotalRange(updatedColumns);
          setMin(bounds.min);
          setMax(bounds.max);
        } else {
          const refreshedState = gu.refreshColumns(
            response.columns,
            columns,
            data,
            updatedRowCount,
            settings,
            maxColumnWidth,
          );
          updatedColumns = refreshedState.columns;
        }
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
        setTriggerResize(refresh ?? updatedTriggerResize);
      }
    });
  };

  React.useEffect(() => {
    getData(ids);
  }, []);

  const previousBackgroundMode = usePrevious(settings.backgroundMode);
  const previousLoading = usePrevious(loading);
  const previousSettings = usePrevious(settings);

  React.useEffect(() => {
    const refresh = previousSettings && JSON.stringify(settings) !== JSON.stringify(previousSettings);
    if (!loading && previousLoading) {
      if (loadQueue.length) {
        const latestIds = loadQueue.pop() ?? [];
        setLoadQueue([]);
        if (ids !== latestIds) {
          getData(latestIds, refresh);
          return;
        }
      }
    }
    if (refresh) {
      getData(ids, true);
    }
  }, [loading, settings]);

  React.useEffect(() => {
    let updatedColumns = gu.updateColWidths(columns, data, rowCount, settings, maxColumnWidth);
    if (settings.backgroundMode === 'outliers') {
      updatedColumns = updatedColumns.map(bu.buildOutlierScales);
    }
    setColumns(updatedColumns);
    setTriggerResize(
      bu.RESIZABLE.includes(settings.backgroundMode ?? '') || bu.RESIZABLE.includes(previousBackgroundMode ?? ''),
    );
  }, [settings.backgroundMode]);

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

  React.useEffect(resizeGrid, [verticalHeaders]);

  React.useEffect(resizeGrid, [
    gu.getActiveCols(columns, settings.backgroundMode).reduce((res, c) => res + (c.width ?? gu.DEFAULT_COL_WIDTH), 0),
  ]);

  const propagateState = (state: Partial<PropagatedState>, callback?: () => void): void => {
    if (state.refresh === true) {
      getData(ids, true);
      callback?.();
      return;
    }
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
    if (state.hasOwnProperty('renameUpdate')) {
      finalState.data = state.renameUpdate?.(state.data ?? data) ?? data;
    }
    setData(finalState.data ?? data);
    setColumns(finalState.columns ?? columns);
    setRowCount(finalState.rowCount ?? rowCount);
    setFixedColumnCount(finalState.fixedColumnCount ?? fixedColumnCount);
    setTriggerResize(finalState.triggerResize ?? triggerResize);
    callback?.();
  };

  React.useEffect(() => {
    reduxUtils.handleReduxState(
      columns,
      data,
      rowCount,
      dataViewerUpdate,
      clearDataViewerUpdate,
      propagateState,
      settings,
    );
  }, [dataViewerUpdate]);

  const cellRenderer = (props: GridCellProps): React.ReactNode => {
    const { columnIndex, key, rowIndex, style } = props;
    return <GridCell {...{ columnIndex, key, rowIndex, style, data, columns, min, max, rowCount, propagateState }} />;
  };

  const onSectionRendered = (params: SectionRenderedParams): void => {
    const { columnStartIndex, columnStopIndex, rowStartIndex, rowStopIndex } = params;
    const columnCount = gu.getActiveCols(columns, settings.backgroundMode).length;
    const startIndex = rowStartIndex * columnCount + columnStartIndex;
    const stopIndex = rowStopIndex * columnCount + columnStopIndex;
    const oldRange = gu.range(ids[0], ids[1] + 1);
    const newIds = gu.range(rowStartIndex, rowStopIndex + 1).filter((idx) => !oldRange.includes(idx));
    if (!newIds.length || newIds.length < 2) {
      return;
    }
    getData([rowStartIndex, rowStopIndex]);
    onRowsRendered.current.func?.({ startIndex, stopIndex });
  };

  return (
    <GridEventHandler columns={columns} data={data}>
      <DtaleHotkeys columns={columns} />
      <DataViewerMenu columns={columns} propagateState={propagateState} rows={rowCount} />
      <InfiniteLoader
        isRowLoaded={({ index }) => data.hasOwnProperty(index)}
        loadMoreRows={() => Promise.resolve(undefined)}
        rowCount={rowCount}
      >
        {(params) => {
          onRowsRendered.current.func = params.onRowsRendered;
          return (
            <AutoSizer className="main-grid col p-0" onResize={() => gridRef.current?.recomputeGridSize()}>
              {({ width, height }) => (
                <>
                  <RibbonMenu />
                  <DataViewerInfo columns={columns} error={error} propagateState={propagateState} />
                  <EditedCellInfo {...{ propagateState, data, columns, rowCount }} />
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
                    onScroll={closeColumnMenu}
                    cellRenderer={cellRenderer}
                    height={gu.gridHeight(height, columns, settings, ribbonMenuOpen, editedTextAreaHeight)}
                    width={width - (menuPinned ? 198 : 3)}
                    columnWidth={({ index }) =>
                      gu.getColWidth(index, columns, settings.backgroundMode, verticalHeaders)
                    }
                    rowHeight={({ index }) =>
                      gu.getRowHeight(index, columns, settings.backgroundMode, maxRowHeight, verticalHeaders)
                    }
                    onSectionRendered={onSectionRendered}
                    ref={gridRef}
                  />
                </>
              )}
            </AutoSizer>
          );
        }}
      </InfiniteLoader>
      <Popup propagateState={propagateState} />
      <Formatting data={data} columns={columns} rowCount={rowCount} propagateState={propagateState} />
      <ColumnMenu columns={columns} propagateState={propagateState} />
      <RibbonDropdown columns={columns} propagateState={propagateState} rows={rowCount} />
    </GridEventHandler>
  );
};
