import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { AnyAction } from 'redux';

import { ActionType, SidePanelAction } from '../../redux/actions/AppActions';
import * as settingsActions from '../../redux/actions/settings';
import { AppState, InstanceSettings, SidePanelType } from '../../redux/state/AppState';
import { truncate } from '../../stringUtils';
import { ColumnFilter, OutlierFilter } from '../DataViewerState';
import * as gu from '../gridUtils';
import * as serverState from '../serverStateManagement';

import { buildMenuHandler, InfoMenuType, predefinedFilterStr } from './infoUtils';

const removeBackticks = (query: string): string => query.replace(/`/g, '');

export const Queries: React.FC<{ prop: string; filters: Record<string, OutlierFilter | ColumnFilter> }> = ({
  filters,
  prop,
}) => {
  const dataId = useSelector((state: AppState) => state.dataId);
  const dispatch = useDispatch();
  const updateSettings = (updatedSettings: Partial<InstanceSettings>): AnyAction =>
    dispatch(settingsActions.updateSettings(updatedSettings) as any as AnyAction);
  const dropColFilter =
    (dropCol: string): (() => Promise<void>) =>
    async (): Promise<void> => {
      const updatedSettings = {
        [prop]: Object.keys(filters).reduce((res, k) => (k === dropCol ? res : { ...res, [k]: filters[k] }), {}),
      };
      await serverState.updateSettings(updatedSettings, dataId);
      updateSettings(updatedSettings);
    };
  return (
    <React.Fragment>
      {Object.entries(filters).map(([col, cfg]) => {
        return (
          <li key={`${prop}-${col}`} data-testid="query-entry">
            <span className="toggler-action">
              <button className="btn btn-plain ignore-clicks" onClick={dropColFilter(col)}>
                <i className="ico-cancel mr-4" />
              </button>
            </span>
            <span className="font-weight-bold text-nowrap">{removeBackticks(cfg.query ?? '')}</span>
          </li>
        );
      })}
    </React.Fragment>
  );
};

/** Component properties for FilterDisplay */
export interface FilterDisplayProps {
  menuOpen?: InfoMenuType;
  setMenuOpen: (menuOpen?: InfoMenuType) => void;
}

const FilterDisplay: React.FC<FilterDisplayProps & WithTranslation> = ({ menuOpen, setMenuOpen, t }) => {
  const reduxState = useSelector((state: AppState) => ({
    dataId: state.dataId,
    predefinedFilterConfigs: state.predefinedFilters,
    hideDropRows: state.hideDropRows,
    invertFilter: state.settings.invertFilter ?? false,
    query: state.settings.query,
    columnFilters: state.settings.columnFilters ?? {},
    predefinedFilters: state.settings.predefinedFilters ?? {},
    outlierFilters: state.settings.outlierFilters ?? {},
    sortInfo: state.settings.sortInfo,
    highlightFilter: state.settings.highlightFilter ?? false,
  }));
  const dispatch = useDispatch();
  const updateSettings = (updatedSettings: Partial<InstanceSettings>): AnyAction =>
    dispatch(settingsActions.updateSettings(updatedSettings) as any as AnyAction);
  const showSidePanel = (view: SidePanelType): SidePanelAction => dispatch({ type: ActionType.SHOW_SIDE_PANEL, view });
  const filterRef = React.useRef<HTMLDivElement>(null);

  const dropFilter =
    (dropCol: string): (() => Promise<void>) =>
    async (): Promise<void> => {
      const updatedSettings = {
        predefinedFilters: {
          ...reduxState.predefinedFilters,
          [dropCol]: { value: reduxState.predefinedFilters[dropCol].value, active: false },
        },
      };
      await serverState.updateSettings(updatedSettings, reduxState.dataId);
      updateSettings(updatedSettings);
    };

  const displayPredefined = (): JSX.Element => (
    <React.Fragment>
      {Object.entries(gu.filterPredefined(reduxState.predefinedFilters)).map(([name, value]) => {
        const displayValue = predefinedFilterStr(reduxState.predefinedFilterConfigs, name, value.value);
        return (
          <li key={`predefined-${name}`}>
            <span className="toggler-action">
              <button className="btn btn-plain ignore-clicks" onClick={dropFilter(name)}>
                <i className="ico-cancel mr-4" />
              </button>
            </span>
            <span className="font-weight-bold text-nowrap">{`${name}: ${displayValue}`}</span>
          </li>
        );
      })}
    </React.Fragment>
  );

  const { query, columnFilters, outlierFilters, predefinedFilterConfigs, dataId } = reduxState;
  if (gu.noFilters(reduxState)) {
    return null;
  }
  const label = <div className="font-weight-bold d-inline-block">{`${t('Filter')}:`}</div>;
  const filterSegs = [
    ...Object.values(columnFilters).map((filter) => filter.query),
    ...Object.values(outlierFilters).map((filter) => filter.query),
    ...Object.entries(gu.filterPredefined(reduxState.predefinedFilters)).map(
      ([name, value]) => `${name}: ${predefinedFilterStr(predefinedFilterConfigs, name, value.value)}`,
    ),
  ];
  if (query) {
    filterSegs.push(query);
  }
  const clearFilter =
    (drop = false): (() => Promise<void>) =>
    async (): Promise<void> => {
      const settingsUpdates = {
        query: '',
        columnFilters: {},
        outlierFilters: {},
        predefinedFilters: Object.entries(reduxState.predefinedFilters).reduce(
          (res, [name, value]) => ({ ...res, [name]: { ...value, active: false } }),
          {},
        ),
        invertFilter: false,
      };
      if (drop) {
        await serverState.dropFilteredRows(dataId);
      } else {
        await serverState.updateSettings(settingsUpdates, dataId);
      }
      updateSettings(settingsUpdates);
    };
  const toggleInvert = async (): Promise<void> => {
    const settingsUpdates = { invertFilter: !reduxState.invertFilter };
    await serverState.updateSettings(settingsUpdates, dataId);
    updateSettings(settingsUpdates);
  };
  const moveToCustom = async (): Promise<void> => {
    const response = await serverState.moveFiltersToCustom(dataId);
    if (response?.settings) {
      updateSettings(response.settings);
      showSidePanel(SidePanelType.FILTER);
    }
  };
  const saveHighlightFilter = async (): Promise<void> => {
    await serverState.updateSettings({ highlightFilter: !reduxState.highlightFilter }, dataId);
    updateSettings({ highlightFilter: !reduxState.highlightFilter });
  };
  const allButtons = (
    <>
      <i
        className="ico-cancel pl-3 pointer"
        style={{ marginTop: '-0.1em' }}
        onClick={clearFilter()}
        title={t('Clear Filters') ?? ''}
      />
      {!reduxState.hideDropRows && (
        <i
          className="fas fa-eraser pl-3 pointer"
          style={{ marginTop: '-0.1em' }}
          onClick={clearFilter(true)}
          title={t('Drop Filtered Rows') ?? ''}
        />
      )}
      <i
        className="fas fa-retweet pl-3 pointer"
        style={{
          marginTop: '-0.1em',
          opacity: reduxState.invertFilter ? 1 : 0.5,
        }}
        onClick={toggleInvert}
        title={t('Invert Filter') ?? ''}
      />
      {(!!Object.keys(columnFilters).length || !!Object.keys(outlierFilters).length) && (
        <i
          className="fa fa-filter pl-3 pointer"
          style={{ marginTop: '-0.1em' }}
          onClick={moveToCustom}
          title={t('Move Filters To Custom') ?? ''}
        />
      )}
      <i
        className="fa-solid fa-highlighter pl-3 pointer"
        style={{
          marginTop: '-0.1em',
          opacity: reduxState.highlightFilter ? 1 : 0.5,
        }}
        onClick={saveHighlightFilter}
        title={t(reduxState.highlightFilter ? 'Hide Filtered Rows' : 'Highlight Filtered Rows') ?? ''}
      />
    </>
  );

  if (filterSegs.length === 1) {
    return (
      <>
        {label}
        <div className="pl-3 d-inline-block filter-menu-toggle">{removeBackticks(filterSegs[0] ?? '')}</div>
        {allButtons}
      </>
    );
  }

  const clickHandler = buildMenuHandler(InfoMenuType.FILTER, setMenuOpen, filterRef);
  const filterText = truncate(removeBackticks(filterSegs.join(' and ')), 30);
  return (
    <>
      {label}
      <div className="pl-3 d-inline-block filter-menu-toggle" onClick={clickHandler} ref={filterRef}>
        <span className="pointer">{filterText}</span>
        <div className="column-toggle__dropdown" hidden={menuOpen !== InfoMenuType.FILTER}>
          <ul>
            <Queries prop="columnFilters" filters={reduxState.columnFilters} />
            <Queries prop="outlierFilters" filters={reduxState.outlierFilters} />
            {displayPredefined()}
            {query && (
              <li>
                <span className="toggler-action">
                  <button
                    className="btn btn-plain ignore-clicks"
                    onClick={async () => {
                      await serverState.updateSettings({ query: '' }, dataId);
                      updateSettings({ query: '' });
                    }}
                  >
                    <i className="ico-cancel mr-4" />
                  </button>
                </span>
                <span className="font-weight-bold text-nowrap">{query}</span>
              </li>
            )}
          </ul>
        </div>
      </div>
      {allButtons}
    </>
  );
};

export default withTranslation('main')(FilterDisplay);
