import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { GlobalHotKeys } from 'react-hotkeys';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { openChart } from '../../actions/charts';
import * as actions from '../../actions/dtale';
import { updateSettings } from '../../actions/settings';
import { buildURLString } from '../../actions/url-utils';
import ColumnFilter from '../../filters/ColumnFilter';
import * as gu from '../gridUtils';
import menuFuncs from '../menu/dataViewerMenuUtils';
import serverState from '../serverStateManagement';
import ColumnMenuHeader from './ColumnMenuHeader';
import ColumnMenuOption from './ColumnMenuOption';
import HeatMapOption from './HeatMapOption';
import SortOptions from './SortOptions';
import { positionMenu } from './columnMenuUtils';

const MOVE_COLS = [
  ['step-backward', serverState.moveToFront, 'Move Column To Front', {}],
  ['caret-left', serverState.moveLeft, 'Move Column Left', { fontSize: '1.2em', padding: 0, width: '1.3em' }],
  ['caret-right', serverState.moveRight, 'Move Column Right', { fontSize: '1.2em', padding: 0, width: '1.3em' }],
  ['step-forward', serverState.moveToBack, 'Move Column To Back', {}],
];

class ReactColumnMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = { style: { minWidth: '14em' } };
    this._div = React.createRef();
  }

  componentDidUpdate(prevProps) {
    const { selectedCol, selectedColRef, ribbonMenuOpen, isPreview } = this.props;
    if (
      selectedCol !== null &&
      (selectedCol !== prevProps.selectedCol || ribbonMenuOpen !== prevProps.ribbonMenuOpen)
    ) {
      const dropRibbon = !ribbonMenuOpen && prevProps.ribbonMenuOpen;
      this.setState({ style: positionMenu(selectedColRef, this._div, isPreview, dropRibbon) });
    }
  }

  render() {
    const { columnMenuOpen, dataId, selectedCol, openChart, t } = this.props;
    if (!selectedCol) {
      return null;
    }
    const colCfg = {
      ...(_.find(this.props.columns, { name: selectedCol }) || {}),
      ..._.get(this.props, ['filteredRanges', 'dtypes', selectedCol], {}),
    };
    const unlocked = _.get(colCfg, 'locked', false) === false;
    const openPopup =
      (type, height = 450, width = 500) =>
      () => {
        if (menuFuncs.shouldOpenPopup(height, width)) {
          menuFuncs.open(
            buildURLString(menuFuncs.fullPath(`/dtale/popup/${type}`, dataId), {
              selectedCol,
            }),
            null,
            height,
            width,
          );
        } else {
          openChart(
            _.assignIn(
              { type, title: _.capitalize(type) },
              _.pick(this.props, ['selectedCol', 'propagateState', 'columns']),
            ),
          );
        }
      };
    const openDescribe = () => {
      if (window.innerWidth < 800) {
        window.open(
          buildURLString(menuFuncs.fullPath('/dtale/popup/describe', dataId), {
            selectedCol,
          }),
          '_blank',
        );
      } else {
        this.props.showSidePanel(selectedCol, 'describe');
      }
    };
    const openFormatting = () =>
      this.props.propagateState({
        formattingOpen: true,
        selectedCols: [selectedCol],
      });
    const hideCol = () => {
      const hideCallback = () => {
        const updatedColumns = _.map(this.props.columns, (c) =>
          _.assignIn({}, c, c.name === selectedCol ? { visible: !c.visible } : {}),
        );
        this.props.propagateState({
          columns: updatedColumns,
          triggerResize: true,
        });
      };
      serverState.toggleVisibility(dataId, selectedCol, hideCallback);
    };
    const deleteCol = () => {
      const yesAction = () =>
        this.props.propagateState(
          { columns: _.reject(this.props.columns, { name: selectedCol }) },
          serverState.deleteColumn(dataId, selectedCol),
        );
      const msg = `Are you sure you want to delete the column "${selectedCol}"?`;
      const title = `Delete column - ${selectedCol}`;
      openChart({ type: 'confirm', title, msg, yesAction, size: 'sm' });
    };
    const renameCol = () =>
      openChart({
        type: 'rename',
        selectedCol,
        columns: this.props.columns,
        size: 'sm',
      });
    const openAction = (action) => openPopup(action, 400, 770);
    const closeMenu = () => this.props.hideColumnMenu(selectedCol);
    return (
      <div
        id="column-menu-div"
        className="column-toggle__dropdown"
        hidden={!columnMenuOpen}
        style={this.state.style}
        ref={this._div}
      >
        {columnMenuOpen && <GlobalHotKeys keyMap={{ CLOSE_MENU: 'esc' }} handlers={{ CLOSE_MENU: closeMenu }} />}
        <ColumnMenuHeader col={selectedCol} colCfg={colCfg} />
        <ul>
          <SortOptions {...this.props} />
          <li>
            <span className="toggler-action">
              <i className="ico-swap-horiz" />
            </span>
            <div className="btn-group compact m-auto font-weight-bold column-sorting">
              {_.map(MOVE_COLS, ([icon, func, hint, icnStyle]) => (
                <button
                  key={icon}
                  style={_.assign({ color: '#565b68', width: '2em' }, icnStyle)}
                  className={`btn btn-primary font-weight-bold`}
                  onClick={func(selectedCol, this.props)}
                  title={t(hint, { ns: 'column_menu' })}
                >
                  <i className={`fas fa-${icon}`} />
                </button>
              ))}
            </div>
          </li>
          {unlocked && (
            <ColumnMenuOption
              open={serverState.lockCols([selectedCol], this.props)}
              label={t('column_menu:Lock')}
              iconClass="fa fa-lock ml-3 mr-4"
            />
          )}
          {!unlocked && (
            <ColumnMenuOption
              open={serverState.unlockCols([selectedCol], this.props)}
              label={t('column_menu:Unlock')}
              iconClass="fa fa-lock-open ml-2 mr-4"
            />
          )}
          <ColumnMenuOption open={hideCol} label={t('column_menu:Hide')} iconClass="ico-visibility-off" />
          <ColumnMenuOption open={deleteCol} label={t('column_menu:Delete')} iconClass="ico-delete" />
          <ColumnMenuOption open={renameCol} label={t('column_menu:Rename')} iconClass="ico-edit" />
          <ColumnMenuOption
            open={openAction('replacement')}
            label={t('column_menu:Replacements')}
            iconClass="fas fa-backspace mr-3"
          />
          <ColumnMenuOption
            open={openAction('type-conversion')}
            label={t('Type Conversion', { ns: 'builders' })}
            iconClass="ico-swap-horiz"
          />
          {gu.findColType(colCfg.dtype) === 'string' && (
            <ColumnMenuOption
              open={openAction('cleaners')}
              label={t('Clean Column', { ns: 'menu' })}
              iconClass="fas fa-pump-soap ml-3 mr-4"
            />
          )}
          <ColumnMenuOption
            open={openAction('duplicates')}
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
          {_.has(colCfg, 'lowVariance') && (
            <ColumnMenuOption
              open={openPopup('variance', 400, 770)}
              label={t('Variance Report', { ns: 'column_menu' })}
              iconClass="fas fa-chart-bar ml-2 mr-4"
            />
          )}
          <ColumnMenuOption open={openFormatting} label={t('column_menu:Formats')} iconClass="ico-palette" />
          <HeatMapOption {..._.pick(this.props, ['propagateState', 'backgroundMode', 'selectedCol'])} colCfg={colCfg} />
          <ColumnFilter {...this.props} />
        </ul>
      </div>
    );
  }
}
ReactColumnMenu.displayName = 'ReactColumnMenu';
ReactColumnMenu.propTypes = {
  selectedCol: PropTypes.string,
  selectedColRef: PropTypes.instanceOf(Element),
  columns: PropTypes.array,
  columnMenuOpen: PropTypes.bool,
  sortInfo: PropTypes.array,
  propagateState: PropTypes.func,
  dataId: PropTypes.string.isRequired,
  openChart: PropTypes.func,
  hideColumnMenu: PropTypes.func,
  outlierFilters: PropTypes.object,
  backgroundMode: PropTypes.string,
  isPreview: PropTypes.bool,
  t: PropTypes.func,
  ribbonMenuOpen: PropTypes.bool,
  showSidePanel: PropTypes.func,
  filteredRanges: PropTypes.object,
};
const TranslatedReactColumnMenu = withTranslation(['menu', 'column_menu', 'builders'])(ReactColumnMenu);
const ReduxColumnMenu = connect(
  (state) => ({
    ..._.pick(state, [
      'dataId',
      'columnMenuOpen',
      'selectedCol',
      'selectedColRef',
      'isPreview',
      'ribbonMenuOpen',
      'filteredRanges',
    ]),
    ...state.settings,
  }),
  (dispatch) => ({
    openChart: (chartProps) => dispatch(openChart(chartProps)),
    hideColumnMenu: (colName) => dispatch(actions.hideColumnMenu(colName)),
    showSidePanel: (column, view) => dispatch({ type: 'show-side-panel', view, column }),
    updateSettings: (settings) => dispatch(updateSettings(settings)),
  }),
)(TranslatedReactColumnMenu);
export { ReduxColumnMenu as ColumnMenu, TranslatedReactColumnMenu as ReactColumnMenu };
