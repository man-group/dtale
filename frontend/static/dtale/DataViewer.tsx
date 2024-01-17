import { createSelector, PayloadAction } from '@reduxjs/toolkit';
import * as React from 'react';
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

import { usePrevious } from '../customHooks';
import Formatting from '../popups/formats/Formatting';
import Popup from '../popups/Popup';
import { AppActions } from '../redux/actions/AppActions';
import * as actions from '../redux/actions/dtale';
import { buildURLParams } from '../redux/actions/url-utils';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import * as selectors from '../redux/selectors';
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

const ROW_SCANS = { arcticdb: 200, base: 55 };

const selectResult = createSelector(
  [
    selectors.selectDataId,
    selectors.selectTheme,
    selectors.selectSettings,
    selectors.selectMenuPinned,
    selectors.selectRibbonMenuOpen,
    selectors.selectDataViewerUpdate,
    selectors.selectMaxColumnWidth,
    selectors.selectMaxRowHeight,
    selectors.selectEditedTextAreaHeight,
    selectors.selectVerticalHeaders,
    selectors.selectIsArcticDB,
    selectors.selectHideMainMenu,
    selectors.selectHideColumnMenus,
  ],
  (
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
    isArcticDB,
    hideMainMenu,
    hideColumnMenus,
  ) => ({
    dataId,
    theme,
    settings: { ...settings, isArcticDB },
    menuPinned,
    ribbonMenuOpen,
    dataViewerUpdate,
    maxColumnWidth: maxColumnWidth || undefined,
    maxRowHeight: maxRowHeight || undefined,
    editedTextAreaHeight,
    verticalHeaders: verticalHeaders ?? false,
    isArcticDB,
    hideMainMenu,
    hideColumnMenus,
  }),
);

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
    isArcticDB,
    hideMainMenu,
    hideColumnMenus,
  } = useAppSelector(selectResult);
  const dispatch = useAppDispatch();
  const closeColumnMenu = (): void => dispatch(actions.closeColumnMenu());
  const updateFilteredRanges = (query: string): void => dispatch(actions.updateFilteredRanges(query));
  const clearDataViewerUpdate = (): PayloadAction<void> => dispatch(AppActions.ClearDataViewerUpdateAction());

  const [rowCount, setRowCount] = React.useState(!!isArcticDB ? isArcticDB : 0);
  const [data, setData] = React.useState<DataViewerData>({});
  const [loading, setLoading] = React.useState(false);
  const [ids, setIds] = React.useState<number[]>([]);
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
        if (Number(key) >= updatedIds[0] - 100 && Number(key) <= updatedIds[1] + 101) {
          return { ...res, [Number(key)]: data[Number(key)] };
        }
        return res;
      }, {} as DataViewerData);
      // Make sure we check to see if the data we are saving is the actual data being displayed by the grid
      const currGrid = (gridRef.current as any)._bottomRightGrid;
      if (currGrid) {
        const currGridData = Object.keys(data).reduce((res, key) => {
          if (Number(key) >= currGrid._renderedRowStartIndex && Number(key) <= currGrid._renderedRowStopIndex) {
            return { ...res, [Number(key)]: data[Number(key)] };
          }
          return res;
        }, {} as DataViewerData);
        savedData = { ...savedData, ...currGridData };
      }
    }
    if (!newIds.length) {
      setLoading(false);
      setTriggerResize(true);
      return;
    }
    const currentSavedIds = Object.keys(savedData);
    currentSavedIds.sort();
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
    getData([0, ROW_SCANS[!!isArcticDB ? 'arcticdb' : 'base']]);
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
    return (
      <GridCell
        {...{ loading, columnIndex, key, rowIndex, style, data, columns, min, max, rowCount, propagateState }}
      />
    );
  };

  const loadTimeout = React.useRef<NodeJS.Timeout | null>(null);

  const onSectionRendered = (params: SectionRenderedParams): void => {
    const { columnStartIndex, columnStopIndex, rowStartIndex, rowStopIndex } = params;
    let updatedRowStartIndex = rowStartIndex;
    if (updatedRowStartIndex === rowCount - 2) {
      if (updatedRowStartIndex <= ids[ids.length - 1]) {
        updatedRowStartIndex = ids[0] + 1;
        (document.querySelector('.BottomLeftGrid_ScrollWrapper') as HTMLElement)?.click();
        return;
      } else {
        updatedRowStartIndex -= !!isArcticDB ? ROW_SCANS.arcticdb : ROW_SCANS.base;
      }
    }
    const columnCount = gu.getActiveCols(columns, settings.backgroundMode).length;
    const startIndex = updatedRowStartIndex * columnCount + columnStartIndex;
    const stopIndex = rowStopIndex * columnCount + columnStopIndex;
    const currentIndexes = Object.keys(data).map((idx) => parseInt(idx, 10));
    const newIds = gu
      .range(Math.max(updatedRowStartIndex - 1, 0), rowStopIndex + 1)
      .filter((idx) => !currentIndexes.includes(idx));
    if (!newIds.length) {
      return;
    }
    if (!!isArcticDB) {
      if (loadTimeout.current) {
        clearTimeout(loadTimeout.current);
      }
      loadTimeout.current = setTimeout(() => {
        getData([
          Math.max(0, updatedRowStartIndex - ROW_SCANS.arcticdb),
          Math.min(rowStopIndex + ROW_SCANS.arcticdb, rowCount - 2),
        ]);
      }, 200);
    } else {
      getData([updatedRowStartIndex, rowStopIndex + ROW_SCANS.base]);
    }
    onRowsRendered.current.func?.({ startIndex, stopIndex });
  };

  return (
    <GridEventHandler columns={columns} data={data}>
      <DtaleHotkeys columns={columns} />
      {!hideMainMenu && <DataViewerMenu columns={columns} propagateState={propagateState} rows={rowCount} />}
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
                    fixedColumnCount={gu.getActiveLockedCols(columns, settings.backgroundMode).length}
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
                    ref={(element: any) => {
                      if (element) {
                        params.registerChild(element);
                        (gridRef as any).current = element;
                      }
                    }}
                  />
                </>
              )}
            </AutoSizer>
          );
        }}
      </InfiniteLoader>
      <Popup propagateState={propagateState} />
      <Formatting data={data} columns={columns} rowCount={rowCount} propagateState={propagateState} />
      {!hideColumnMenus && <ColumnMenu columns={columns} data={data} propagateState={propagateState} />}
      <RibbonDropdown columns={columns} propagateState={propagateState} rows={rowCount} />
    </GridEventHandler>
  );
};
