import { createSelector, PayloadAction } from '@reduxjs/toolkit';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import Aggregations from '../popups/aggregations/Aggregations';
import { AppActions } from '../redux/actions/AppActions';
import * as chartActions from '../redux/actions/charts';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import * as selectors from '../redux/selectors';
import { Popups, PopupType, RangeState } from '../redux/state/AppState';

import { ColumnDef, DataViewerData, StringColumnFormat } from './DataViewerState';
import { convertCellIdxToCoords, getCell, isCellEditable } from './gridUtils';
import { MeasureText } from './MeasureText';
import { MenuTooltip } from './menu/MenuTooltip';
import { buildCopyText, buildRangeState, buildRowCopyText, CopyText, toggleSelection } from './rangeSelectUtils';
import { SidePanel } from './side/SidePanel';
import * as panelUtils from './side/sidePanelUtils';

const cellIsNotOnEdge = (cellIdx: string): boolean => !cellIdx.startsWith('0|') && !cellIdx.endsWith('|0');

/** Component properties for GridEventHandler */
export interface GridEventHandlerProps {
  columns: ColumnDef[];
  data: DataViewerData;
}

const selectResult = createSelector(
  [
    selectors.selectAllowCellEdits,
    selectors.selectDataId,
    selectors.selectBaseRibbonMenuOpen,
    selectors.selectMenuPinned,
    selectors.selectRibbonDropdownVisible,
    selectors.selectSidePanelVisible,
    selectors.selectSidePanelView,
    selectors.selectSidePanelOffset,
    selectors.selectDragResize,
    selectors.selectRangeSelect,
    selectors.selectRowRange,
    selectors.selectCtrlRows,
    selectors.selectSettings,
    selectors.selectLockHeaderMenu,
    selectors.selectHideHeaderMenu,
    selectors.selectIsArcticDB,
  ],
  (
    allowCellEdits,
    dataId,
    ribbonMenuOpen,
    menuPinned,
    ribbonDropdownOpen,
    sidePanelOpen,
    sidePanel,
    sidePanelOffset,
    dragResize,
    rangeSelect,
    rowRange,
    ctrlRows,
    settings,
    lockHeaderMenu,
    hideHeaderMenu,
    isArcticDB,
  ) => ({
    allowCellEdits: allowCellEdits && !isArcticDB,
    dataId,
    menuPinned,
    ribbonMenuOpen,
    ribbonDropdownOpen,
    sidePanelOpen,
    sidePanel,
    sidePanelOffset,
    dragResize,
    rangeSelect,
    rowRange,
    ctrlRows,
    settings,
    lockHeaderMenu,
    hideHeaderMenu,
  }),
);

const GridEventHandler: React.FC<React.PropsWithChildren<GridEventHandlerProps & WithTranslation>> = ({
  columns,
  data,
  t,
  children,
}) => {
  const {
    allowCellEdits,
    dataId,
    ribbonMenuOpen,
    menuPinned,
    ribbonDropdownOpen,
    sidePanelOpen,
    sidePanel,
    sidePanelOffset,
    dragResize,
    rangeSelect,
    rowRange,
    ctrlRows,
    settings,
    lockHeaderMenu,
    hideHeaderMenu,
  } = useAppSelector(selectResult);
  const dispatch = useAppDispatch();
  const openChart = (chartData: Popups): PayloadAction<Popups> => dispatch(chartActions.openChart(chartData));
  const editCell = (editedCell: string): PayloadAction<string | undefined> =>
    dispatch(AppActions.EditedCellAction(editedCell));
  const setRibbonVisibility = (show: boolean): PayloadAction<void> =>
    dispatch(show ? AppActions.ShowRibbonMenuAction() : AppActions.HideRibbonMenuAction());
  const showTooltip = (
    element: HTMLElement,
    content: React.ReactNode,
  ): PayloadAction<{
    element: HTMLElement;
    content: React.ReactNode;
  }> => dispatch(AppActions.ShowMenuTooltipAction({ element, content }));
  const hideTooltip = (): PayloadAction<void> => dispatch(AppActions.HideMenuTooltipAction());
  const updateRangeState = (state: RangeState): PayloadAction<RangeState> =>
    dispatch(AppActions.SetRangeStateAction({ ...state }));

  const [currY, setCurrY] = React.useState<number>();
  const gridPanel = React.useRef<HTMLDivElement>(null);
  const hideTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const showTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const clickTimeout = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    const keyHandler = (e: KeyboardEvent): void => {
      document.onselectstart = (): boolean => !(e.key === 'Shift' && e.shiftKey) && e.key !== 'Meta';
    };
    window.addEventListener('keyup', keyHandler);
    window.addEventListener('keydown', keyHandler);
    return () => {
      window.removeEventListener('keyup', keyHandler);
      window.removeEventListener('keydown', keyHandler);
    };
  }, []);

  const handleRangeSelect = (cellIdx: string): void => {
    if (rangeSelect) {
      const copyText = buildCopyText(data, columns, rangeSelect.start, cellIdx);
      const title = t('Copy Range to Clipboard?');
      openChart({
        ...copyText,
        type: PopupType.COPY_RANGE,
        title,
        size: 'sm',
        visible: true,
      });
    } else {
      updateRangeState(buildRangeState({ rangeSelect: { start: cellIdx, end: cellIdx } }));
    }
  };

  const handleRowSelect = (cellIdx: string): void => {
    const coords = convertCellIdxToCoords(cellIdx);
    if (rowRange) {
      const title = t('Copy Rows to Clipboard?');
      const callback = (copyText: CopyText): PayloadAction<Popups> =>
        openChart({
          ...copyText,
          type: PopupType.COPY_ROW_RANGE,
          title,
          size: 'sm',
          visible: true,
        });
      buildRowCopyText(dataId, columns, { start: `${rowRange.start}`, end: `${coords[1]}` }, callback);
    } else {
      updateRangeState(buildRangeState({ rowRange: { start: coords[1], end: coords[1] } }));
    }
  };

  const handleCtrlRowSelect = (cellIdx: string): void => {
    const coords = convertCellIdxToCoords(cellIdx);
    if (ctrlRows) {
      updateRangeState(buildRangeState({ ctrlRows: toggleSelection(ctrlRows, coords[1]) }));
    } else {
      updateRangeState(buildRangeState({ ctrlRows: [coords[1]] }));
    }
  };

  const handleLongStringDisplay = (e: React.MouseEvent, cellIdx: string): void => {
    const resized = (e.target as any).querySelector('div.resized');
    if (resized && resized.clientWidth < resized.scrollWidth) {
      const { colCfg, rec } = getCell(cellIdx, columns, data, settings.backgroundMode);
      const isLink = settings.columnFormats?.[colCfg.name]?.fmt?.link === true;
      const isHtml = (settings.columnFormats?.[colCfg.name]?.fmt as StringColumnFormat)?.html === true;
      if (!isLink && !isHtml) {
        showTooltip(resized, rec.raw);
        return;
      }
    }
    hideTooltip();
  };

  const handleMouseMove = (e: React.MouseEvent): void => {
    setCurrY(e.clientY);
  };

  React.useEffect(() => {
    if (lockHeaderMenu || hideHeaderMenu) {
      return;
    }
    if (currY !== undefined && currY <= 5) {
      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
      }
      hideTimeout.current = null;
      if (!ribbonMenuOpen) {
        showTimeout.current = setTimeout(() => {
          if (currY !== undefined && currY <= 5) {
            setRibbonVisibility(true);
          }
        }, 500);
      }
    } else if (!ribbonDropdownOpen && ribbonMenuOpen && currY !== undefined && currY >= 35 && !hideTimeout.current) {
      hideTimeout.current = setTimeout(() => {
        setRibbonVisibility(false);
        hideTimeout.current = null;
      }, 2000);
      if (showTimeout.current) {
        clearTimeout(showTimeout.current);
        showTimeout.current = null;
      }
    }
  }, [currY]);

  const handleMouseOver = (e: React.MouseEvent): void => {
    const rangeExists = rangeSelect && rangeSelect.start;
    const rowRangeExists = rowRange && rowRange.start;
    const cellIdx = (e.target as any).attributes?.cell_idx?.nodeValue;
    if (e.shiftKey) {
      if (rangeExists) {
        if (cellIdx && cellIsNotOnEdge(cellIdx)) {
          updateRangeState(
            buildRangeState({
              rangeSelect: { ...rangeSelect, end: cellIdx ?? null },
            }),
          );
        }
      }
      if (rowRangeExists) {
        if (cellIdx && cellIdx.startsWith('0|')) {
          const coords = convertCellIdxToCoords(cellIdx);
          updateRangeState(buildRangeState({ rowRange: { ...rowRange, end: coords[1] } }));
        }
      }
    } else if (rangeExists || rowRangeExists) {
      updateRangeState(buildRangeState());
    } else if (cellIdx && Object.keys(data).length && cellIsNotOnEdge(cellIdx)) {
      handleLongStringDisplay(e, cellIdx);
    } else if (cellIdx) {
      hideTooltip();
    }
  };

  const handleClicks = (e: React.MouseEvent): void => {
    setRibbonVisibility(false);
    // check for range selected
    const cellIdx = (e.target as any).attributes?.cell_idx?.nodeValue;
    if (e.shiftKey) {
      if (cellIdx && cellIsNotOnEdge(cellIdx)) {
        handleRangeSelect(cellIdx);
      } else if (cellIdx && cellIdx.startsWith('0|')) {
        handleRowSelect(cellIdx);
      }
      return;
    } else if (e.ctrlKey || e.metaKey) {
      if (cellIdx?.startsWith('0|')) {
        handleCtrlRowSelect(cellIdx);
      }
      return;
    } else if (cellIdx?.startsWith('0|')) {
      const coords = convertCellIdxToCoords(cellIdx);
      updateRangeState(buildRangeState({ selectedRow: coords[1] }));
      return;
    }

    const coords = convertCellIdxToCoords(cellIdx);
    const clickedCol = columns.find((c) => c.index + 1 === coords[0]);
    if (isCellEditable(allowCellEdits, clickedCol)) {
      if (clickTimeout.current === null) {
        clickTimeout.current = setTimeout(() => {
          if (clickTimeout.current) {
            clearTimeout(clickTimeout.current);
            clickTimeout.current = null;
          }
        }, 2000);
      } else {
        if (cellIdx) {
          editCell(cellIdx);
        }
        if (clickTimeout.current) {
          clearTimeout(clickTimeout.current);
          clickTimeout.current = null;
        }
      }
    }
    updateRangeState(buildRangeState());
  };

  return (
    <div className={`h-100 w-100 d-flex ${menuPinned ? 'is-pinned' : ''}`}>
      <div
        className={`main-panel-content${sidePanelOpen ? ' is-half' : ''} ${sidePanel ?? ''} h-100 d-flex`}
        style={sidePanelOpen ? panelUtils.calcWidth(sidePanel!, sidePanelOffset) : {}}
        onMouseOver={handleMouseOver}
        onMouseMove={handleMouseMove}
        onClick={handleClicks}
        ref={gridPanel}
      >
        {children}
      </div>
      <MenuTooltip />
      <MeasureText />
      <SidePanel gridPanel={gridPanel.current} />
      {dragResize && <div className="blue-line" style={{ left: dragResize + 3 }} />}
      <Aggregations columns={columns} />
    </div>
  );
};

export default withTranslation('main')(GridEventHandler);
