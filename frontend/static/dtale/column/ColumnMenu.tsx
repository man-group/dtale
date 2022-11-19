import * as React from 'react';
import { GlobalHotKeys } from 'react-hotkeys';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { AnyAction } from 'redux';

import { usePrevious } from '../../customHooks';
import ColumnFilter from '../../filters/ColumnFilter';
import { ActionType, OpenChartAction, OpenFormattingAction, SidePanelAction } from '../../redux/actions/AppActions';
import * as chartActions from '../../redux/actions/charts';
import * as actions from '../../redux/actions/dtale';
import { buildURLString } from '../../redux/actions/url-utils';
import { AppState, Popups, PopupType, SidePanelType } from '../../redux/state/AppState';
import { ColumnDef, DataViewerPropagateState } from '../DataViewerState';
import * as gu from '../gridUtils';
import * as menuFuncs from '../menu/dataViewerMenuUtils';
import * as serverState from '../serverStateManagement';

import { ColumnMenuHeader } from './ColumnMenuHeader';
import { ColumnMenuOption } from './ColumnMenuOption';
import { positionMenu } from './columnMenuUtils';
import HeatMapOption from './HeatMapOption';
import SortOptions from './SortOptions';

/** Component properties of ColumnMenu */
export interface ColumnMenuProps {
  columns: ColumnDef[];
  propagateState: DataViewerPropagateState;
  backgroundMode?: string;
}

const ColumnMenu: React.FC<ColumnMenuProps & WithTranslation> = ({ backgroundMode, columns, propagateState, t }) => {
  const reduxState = useSelector((state: AppState) => ({
    dataId: state.dataId,
    columnMenuOpen: state.columnMenuOpen,
    selectedCol: state.selectedCol,
    selectedColRef: state.selectedColRef,
    isPreview: state.isPreview,
    ribbonMenuOpen: state.ribbonMenuOpen,
    filteredRanges: state.filteredRanges,
    columnFilters: state.settings.columnFilters,
    outlierFilters: state.settings.outlierFilters,
    sortInfo: state.settings.sortInfo,
  }));
  const prevRibbonOpen = usePrevious(reduxState.ribbonMenuOpen);

  const dispatch = useDispatch();
  const openChart = (chartData: Popups): OpenChartAction => dispatch(chartActions.openChart(chartData));
  const hideColumnMenu = (colName: string): AnyAction => dispatch(actions.hideColumnMenu(colName) as any as AnyAction);
  const showSidePanel = (column: string, view: SidePanelType): SidePanelAction =>
    dispatch({ type: ActionType.SHOW_SIDE_PANEL, view, column });

  const divRef = React.useRef<HTMLDivElement>(null);
  const [style, setStyle] = React.useState<React.CSSProperties>({ minWidth: '14em' });

  React.useEffect(() => {
    if (reduxState.selectedCol || reduxState.ribbonMenuOpen !== prevRibbonOpen) {
      const dropRibbon = reduxState.ribbonMenuOpen === false && prevRibbonOpen === true;
      setStyle(positionMenu(reduxState.selectedColRef!, divRef, reduxState.isPreview, dropRibbon));
    }
  }, [reduxState.selectedCol]);

  const { columnMenuOpen, dataId, selectedCol } = reduxState;
  if (!selectedCol) {
    return null;
  }
  const colCfg = {
    ...columns.find(({ name }) => name === selectedCol),
    ...reduxState.filteredRanges?.dtypes?.[selectedCol],
  } as ColumnDef;
  const unlocked = !colCfg.locked;
  const openPopup =
    (popup: Popups, height = 450, width = 500) =>
    () => {
      if (menuFuncs.shouldOpenPopup(height, width)) {
        menuFuncs.open(
          buildURLString(menuFuncs.fullPath(`/dtale/popup/${popup.type}`, dataId), {
            selectedCol,
          }),
          undefined,
          height,
          width,
        );
      } else {
        openChart(popup);
      }
    };
  const openDescribe = (): void => {
    if (window.innerWidth < 800) {
      window.open(buildURLString(menuFuncs.fullPath('/dtale/popup/describe', dataId), { selectedCol }), '_blank');
    } else {
      showSidePanel(selectedCol, SidePanelType.DESCRIBE);
    }
  };
  const openFormatting = (): OpenFormattingAction => dispatch({ type: ActionType.OPEN_FORMATTING, selectedCol });
  const hideCol = async (): Promise<void> => {
    await serverState.toggleVisibility(dataId, selectedCol);
    const updatedColumns = columns.map((c) => ({ ...c, ...(c.name === selectedCol ? { visible: !c.visible } : {}) }));
    propagateState({ columns: updatedColumns, triggerResize: true });
  };
  const deleteCol = (): void => {
    const yesAction = (): void =>
      propagateState(
        { columns: columns.filter(({ name }) => name !== selectedCol) },
        async () => await serverState.deleteColumn(dataId, selectedCol),
      );
    const msg = `Are you sure you want to delete the column "${selectedCol}"?`;
    const title = `Delete column - ${selectedCol}`;
    openChart({ type: PopupType.CONFIRM, title, msg, yesAction, size: 'sm', visible: true });
  };
  const renameCol = (): OpenChartAction =>
    openChart({ type: PopupType.RENAME, selectedCol, columns, size: 'sm', visible: true });
  const openAction = (popup: Popups): (() => void) => openPopup(popup, 400, 770);
  const closeMenu = (): AnyAction => hideColumnMenu(selectedCol);

  const renderMoveBtn = (
    icon: string,
    func: (selectedCol: string, props: serverState.ColumnOperationProps) => () => void,
    hint: string,
    icnStyle?: React.CSSProperties,
  ): JSX.Element => (
    <button
      style={{ color: '#565b68', width: '2em', ...icnStyle }}
      className={`btn btn-primary font-weight-bold`}
      onClick={func(selectedCol, { columns, propagateState, dataId })}
      title={t(hint, { ns: 'column_menu' }) ?? ''}
    >
      <i className={`fas fa-${icon}`} />
    </button>
  );

  return (
    <div id="column-menu-div" className="column-toggle__dropdown" hidden={!columnMenuOpen} style={style} ref={divRef}>
      {columnMenuOpen && <GlobalHotKeys keyMap={{ CLOSE_MENU: 'esc' }} handlers={{ CLOSE_MENU: closeMenu }} />}
      <ColumnMenuHeader col={selectedCol} colCfg={colCfg} />
      <ul>
        <SortOptions sortInfo={reduxState.sortInfo} selectedCol={selectedCol} />
        <li>
          <span className="toggler-action">
            <i className="ico-swap-horiz" />
          </span>
          <div className="btn-group compact m-auto font-weight-bold column-sorting">
            {renderMoveBtn('step-backward', serverState.moveToFront, 'Move Column To Front')}
            {renderMoveBtn('caret-left', serverState.moveLeft, 'Move Column Left', {
              fontSize: '1.2em',
              padding: 0,
              width: '1.3em',
            })}
            {renderMoveBtn('caret-right', serverState.moveRight, 'Move Column Right', {
              fontSize: '1.2em',
              padding: 0,
              width: '1.3em',
            })}
            {renderMoveBtn('step-forward', serverState.moveToBack, 'Move Column To Back')}
          </div>
        </li>
        {unlocked && (
          <ColumnMenuOption
            open={serverState.lockCols([selectedCol], { columns, propagateState, dataId })}
            label={t('column_menu:Lock')}
            iconClass="fa fa-lock ml-3 mr-4"
          />
        )}
        {!unlocked && (
          <ColumnMenuOption
            open={serverState.unlockCols([selectedCol], { columns, propagateState, dataId })}
            label={t('column_menu:Unlock')}
            iconClass="fa fa-lock-open ml-2 mr-4"
          />
        )}
        <ColumnMenuOption open={hideCol} label={t('column_menu:Hide')} iconClass="ico-visibility-off" />
        <ColumnMenuOption open={deleteCol} label={t('column_menu:Delete')} iconClass="ico-delete" />
        <ColumnMenuOption open={renameCol} label={t('column_menu:Rename')} iconClass="ico-edit" />
        <ColumnMenuOption
          open={openAction({
            type: PopupType.REPLACEMENT,
            selectedCol,
            propagateState,
            title: 'Replacement',
            visible: true,
          })}
          label={t('column_menu:Replacements')}
          iconClass="fas fa-backspace mr-3"
        />
        <ColumnMenuOption
          open={openAction({
            type: PopupType.TYPE_CONVERSION,
            selectedCol,
            title: 'Type Conversion',
            visible: true,
          })}
          label={t('Type Conversion', { ns: 'builders' })}
          iconClass="ico-swap-horiz"
        />
        {gu.findColType(colCfg.dtype) === gu.ColumnType.STRING && (
          <ColumnMenuOption
            open={openAction({
              type: PopupType.CLEANERS,
              selectedCol,
              title: 'Cleaners',
              visible: true,
            })}
            label={t('Clean Column', { ns: 'menu' })}
            iconClass="fas fa-pump-soap ml-3 mr-4"
          />
        )}
        <ColumnMenuOption
          open={openAction({ type: PopupType.DUPLICATES, selectedCol, title: 'Duplicates', visible: true })}
          label={t('Duplicates', { ns: 'menu' })}
          iconClass="fas fa-clone ml-2 mr-4"
        />
        <ColumnMenuOption
          open={openDescribe}
          label={
            <>
              {t('Describe', { ns: 'menu' })}
              <small className="pl-3">({t('Column Analysis', { ns: 'column_menu' })})</small>
            </>
          }
          iconClass="ico-view-column"
        />
        {colCfg.lowVariance && (
          <ColumnMenuOption
            open={openPopup({ type: PopupType.VARIANCE, selectedCol, title: 'Variance', visible: true })}
            label={t('Variance Report', { ns: 'column_menu' })}
            iconClass="fas fa-chart-bar ml-2 mr-4"
          />
        )}
        <ColumnMenuOption open={openFormatting} label={t('column_menu:Formats')} iconClass="ico-palette" />
        <HeatMapOption {...{ propagateState, backgroundMode, selectedCol, colCfg }} />
        <ColumnFilter
          columns={columns}
          columnFilters={reduxState.columnFilters}
          selectedCol={selectedCol}
          outlierFilters={reduxState.outlierFilters}
        />
      </ul>
    </div>
  );
};

export default withTranslation(['menu', 'column_menu', 'builders'])(ColumnMenu);
