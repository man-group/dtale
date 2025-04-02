import { createSelector, PayloadAction } from '@reduxjs/toolkit';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import * as chartActions from '../../redux/actions/charts';
import * as settingsActions from '../../redux/actions/settings';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import * as selectors from '../../redux/selectors';
import { InstanceSettings, Popups, PopupType } from '../../redux/state/AppState';
import { ColumnDef, DataViewerPropagateState } from '../DataViewerState';
import * as gu from '../gridUtils';
import ArcticDBOption from '../menu/ArcticDBOption';
import * as menuFuncs from '../menu/dataViewerMenuUtils';
import JumpToColumnOption from '../menu/JumpToColumnOption';
import * as serverState from '../serverStateManagement';

import FilterDisplay from './FilterDisplay';
import { buildMenuHandler, InfoMenuType } from './infoUtils';

require('./DataViewerInfo.scss');

/** Component properties for DataViewerInfo */
export interface DataViewerInfoProps {
  columns: ColumnDef[];
  error?: JSX.Element;
  propagateState: DataViewerPropagateState;
}

const selectResult = createSelector(
  [
    selectors.selectDataId,
    selectors.selectPredefinedFilterConfigs,
    selectors.selectInvertFilter,
    selectors.selectQuery,
    selectors.selectColumnFilters,
    selectors.selectPredefinedFilters,
    selectors.selectOutlierFilters,
    selectors.selectSortInfo,
    selectors.selectHighlightFilter,
    selectors.selectIsArcticDB,
    selectors.selectArcticConn,
    selectors.selectIsVSCode,
    selectors.selectColumnCount,
  ],
  (
    dataId,
    predefinedFilterConfigs,
    invertFilter,
    query,
    columnFilters,
    predefinedFilters,
    outlierFilters,
    sortInfo,
    highlightFilter,
    isArcticDB,
    arcticConn,
    isVSCode,
    columnCount,
  ) => ({
    dataId,
    predefinedFilterConfigs,
    invertFilter: invertFilter ?? false,
    query,
    columnFilters: columnFilters ?? {},
    predefinedFilters: predefinedFilters ?? {},
    outlierFilters: outlierFilters ?? {},
    sortInfo,
    highlightFilter: highlightFilter ?? false,
    isArcticDB,
    arcticConn,
    isVSCode,
    columnCount,
  }),
);

const DataViewerInfo: React.FC<DataViewerInfoProps & WithTranslation> = ({ columns, error, propagateState, t }) => {
  const reduxState = useAppSelector(selectResult);
  const dispatch = useAppDispatch();
  const openChart = (chartData: Popups): PayloadAction<Popups> => dispatch(chartActions.openChart(chartData));
  const updateSettings = (updatedSettings: Partial<InstanceSettings>): void =>
    dispatch(settingsActions.updateSettings(updatedSettings));

  const [menuOpen, setMenuOpen] = React.useState<InfoMenuType>();
  const sortRef = React.useRef<HTMLDivElement>(null);
  const hideRef = React.useRef<HTMLDivElement>(null);
  const arcticRef = React.useRef<HTMLDivElement>(null);

  const arcticDBPopup = menuFuncs.openPopup(
    { type: PopupType.ARCTICDB, visible: true },
    reduxState.dataId,
    openChart,
    450,
    500,
    reduxState.isVSCode,
  );

  const jumpToColumnPopup = menuFuncs.openPopup(
    { type: PopupType.JUMP_TO_COLUMN, columns, visible: true },
    reduxState.dataId,
    openChart,
    450,
    500,
    reduxState.isVSCode,
  );

  const renderSort = (): React.ReactNode => {
    if (!reduxState.sortInfo?.length || !!reduxState.isArcticDB) {
      return null;
    }
    const label = <div className="font-weight-bold d-inline-block">{t('Sort')}:</div>;
    const clearAll = (
      <i
        className="ico-cancel pl-3 pointer"
        style={{ marginTop: '-0.1em' }}
        onClick={() => updateSettings({ sortInfo: [] })}
      />
    );
    if (reduxState.sortInfo.length === 1) {
      return (
        <React.Fragment>
          {label}
          <div className="pl-3 d-inline-block">{`${reduxState.sortInfo[0][0]} (${reduxState.sortInfo[0][1]})`}</div>
          {clearAll}
        </React.Fragment>
      );
    }
    let sortText = reduxState.sortInfo.map(([col, dir]) => `${col} (${dir})`).join(', ');
    if (sortText.length > 60) {
      sortText = `${reduxState.sortInfo.length} ${t('Sorts')}`;
    }
    const clickHandler = buildMenuHandler(InfoMenuType.SORT, setMenuOpen, sortRef);
    const dropSort = (dropCol: string) => () =>
      updateSettings({ sortInfo: reduxState.sortInfo?.filter((s) => s[0] !== dropCol) ?? [] });
    return (
      <React.Fragment>
        {label}
        <div ref={sortRef} className="pl-3 d-inline-block sort-menu-toggle info-link" onClick={clickHandler}>
          <span className="pointer">{sortText}</span>
          <div className="column-toggle__dropdown" hidden={menuOpen !== InfoMenuType.SORT}>
            <ul>
              {reduxState.sortInfo.map(([col, dir]) => (
                <li key={`${col}-${dir}`}>
                  <span className="toggler-action">
                    <button className="btn btn-plain ignore-click" onClick={dropSort(col)}>
                      <i className="ico-cancel mr-4" />
                    </button>
                  </span>
                  <span className="font-weight-bold text-nowrap">{`${col} (${dir})`}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {clearAll}
      </React.Fragment>
    );
  };

  const renderHidden = (): React.ReactNode => {
    if (gu.noHidden(columns)) {
      return null;
    }
    const label = <div className="font-weight-bold d-inline-block">{t('Hidden')}:</div>;
    const hidden = columns.filter((c) => !c.visible).map((c) => c.name);
    const clearHidden = async (): Promise<void> => {
      const visibility = columns.reduce((ret, { name }) => ({ ...ret, [name]: true }), {});
      await serverState.updateVisibility(reduxState.dataId, visibility);
      propagateState({
        columns: columns.map((c) => ({ ...c, visible: true })),
        triggerResize: true,
      });
    };
    const clearAll = <i className="ico-cancel pl-3 pointer" style={{ marginTop: '-0.1em' }} onClick={clearHidden} />;
    if (hidden.length === 1) {
      return (
        <React.Fragment>
          {label}
          <div className="pl-3 d-inline-block filter-menu-toggle">{hidden.join(', ')}</div>
          {clearAll}
        </React.Fragment>
      );
    }
    const clickHandler = buildMenuHandler(InfoMenuType.HIDDEN, setMenuOpen, hideRef);
    let hiddenText = hidden.join(', ');
    if (hiddenText.length > 30) {
      hiddenText = `${hidden.length} ${t('Columns')}`;
    }
    const unhideCol =
      (colToUnhide: string): (() => Promise<void>) =>
      async (): Promise<void> => {
        const updatedColumns = columns.map((c) => ({ ...c, visible: c.name === colToUnhide ? true : c.visible }));
        await serverState.toggleVisibility(reduxState.dataId, colToUnhide);
        propagateState({ columns: updatedColumns });
      };
    return (
      <React.Fragment>
        {label}
        <div ref={hideRef} className="pl-3 d-inline-block hidden-menu-toggle info-link" onClick={clickHandler}>
          <span className="pointer">{hiddenText}</span>
          <div className="column-toggle__dropdown" hidden={menuOpen !== InfoMenuType.HIDDEN}>
            <div
              style={{
                maxHeight: 'calc(50vh)',
                overflowY: 'scroll',
                overflowX: 'hidden',
              }}
            >
              <ul>
                {hidden.map((col, i) => (
                  <li key={i}>
                    <span className="toggler-action">
                      <button className="btn btn-plain ignore-clicks" onClick={unhideCol(col)}>
                        <i className="ico-cancel mr-4" />
                      </button>
                    </span>
                    <span className="font-weight-bold text-nowrap">{col}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        {clearAll}
      </React.Fragment>
    );
  };

  const renderArctic = (): React.ReactNode => {
    if (!reduxState.isArcticDB) {
      return null;
    }
    const clickHandler = buildMenuHandler(InfoMenuType.ARCTICDB, setMenuOpen, arcticRef);
    const dataSelection = decodeURIComponent(decodeURIComponent(reduxState.dataId));
    const [library, symbol] = dataSelection.split('|');

    return (
      <React.Fragment>
        <div className="font-weight-bold d-inline-block">{t('ArcticDB')}:</div>
        <div
          ref={arcticRef}
          className="pl-3 d-inline-block arctic-menu-toggle info-link"
          onClick={reduxState.columnCount <= 100 ? arcticDBPopup : clickHandler}
        >
          <span>
            <div className="d-inline-block info-link" style={{ maxWidth: 100, verticalAlign: 'bottom' }}>
              <div className="resized" title={reduxState.arcticConn}>
                {reduxState.arcticConn}
              </div>
            </div>
            {` (`}
            <b>lib</b>
            {`: ${library}, `}
            <b>symbol</b>
            {`: ${symbol ?? ''})`}
          </span>
          <div
            className="column-toggle__dropdown"
            hidden={menuOpen !== InfoMenuType.ARCTICDB}
            style={{ minWidth: '12em' }}
          >
            <ul>
              <ArcticDBOption open={arcticDBPopup} />
              {reduxState.columnCount > 100 && <JumpToColumnOption open={jumpToColumnPopup} />}
            </ul>
          </div>
        </div>
      </React.Fragment>
    );
  };

  return (
    <React.Fragment>
      <div className={`row data-viewer-error${error ? ' is-expanded' : ''}`}>
        <div className="col-md-12">{error}</div>
      </div>
      <div
        className={`row text-center data-viewer-info${gu.hasNoInfo(reduxState, columns) ? '' : ' is-expanded'}`}
        style={!!reduxState.isArcticDB ? { background: '#FFE600' } : {}}
      >
        <div className="col text-left">
          {renderSort()}
          {renderArctic()}
        </div>
        <div className="col-auto">
          <FilterDisplay menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
        </div>
        <div className="col text-right">{renderHidden()}</div>
      </div>
    </React.Fragment>
  );
};

export default withTranslation('main')(DataViewerInfo);
