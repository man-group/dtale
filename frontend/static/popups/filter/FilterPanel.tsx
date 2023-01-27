import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { AnyAction } from 'redux';

import ButtonToggle from '../../ButtonToggle';
import { ColumnFilter, OutlierFilter } from '../../dtale/DataViewerState';
import * as serverState from '../../dtale/serverStateManagement';
import SidePanelButtons from '../../dtale/side/SidePanelButtons';
import { ActionType, HideSidePanelAction, SetQueryEngineAction } from '../../redux/actions/AppActions';
import * as dtaleActions from '../../redux/actions/dtale';
import * as settingsActions from '../../redux/actions/settings';
import { AppState, InstanceSettings, QueryEngine } from '../../redux/state/AppState';
import { RemovableError } from '../../RemovableError';
import * as CustomFilterRepository from '../../repository/CustomFilterRepository';
import { Checkbox } from '../create/LabeledCheckbox';

import ContextVariables from './ContextVariables';
import PandasQueryHelp from './PandasQueryHelp';
import QueryExamples from './QueryExamples';
import StructuredFilters from './StructuredFilters';

const FilterPanel: React.FC<WithTranslation> = ({ t }) => {
  const { dataId, queryEngine, settings } = useSelector((state: AppState) => ({
    dataId: state.dataId,
    queryEngine: state.queryEngine,
    settings: state.settings,
  }));

  const dispatch = useDispatch();
  const hideSidePanel = (): HideSidePanelAction => dispatch({ type: ActionType.HIDE_SIDE_PANEL });
  const updateSettings = (updatedSettings: Partial<InstanceSettings>, callback?: () => void): AnyAction =>
    dispatch(settingsActions.updateSettings(updatedSettings, callback) as any as AnyAction);
  const setEngine = (engine: QueryEngine): SetQueryEngineAction => dispatch(dtaleActions.setQueryEngine(engine));

  const [query, setQuery] = React.useState('');
  const [highlightFilter, setHighlightFilter] = React.useState(settings.highlightFilter ?? false);
  const [contextVars, setContextVars] = React.useState<Array<{ name: string; value: string }>>([]);
  const [columnFilters, setColumnFilters] = React.useState<Record<string, ColumnFilter>>({});
  const [outlierFilters, setOutlierFilters] = React.useState<Record<string, OutlierFilter>>({});
  const [error, setError] = React.useState<JSX.Element>();

  React.useEffect(() => {
    CustomFilterRepository.loadInfo(dataId).then((response) => {
      if (response?.error) {
        setError(<RemovableError {...response} onRemove={() => setError(undefined)} />);
        return;
      }
      if (response) {
        setQuery(response.query);
        setContextVars(response.contextVars);
        setColumnFilters(response.columnFilters);
        setOutlierFilters(response.outlierFilters);
      }
    });
  }, []);

  const save = async (): Promise<void> => {
    const response = await CustomFilterRepository.save(dataId, query);
    if (response?.error) {
      setError(<RemovableError {...response} onRemove={() => setError(undefined)} />);
      return;
    }
    updateSettings({ query }, hideSidePanel);
  };

  const saveHighlightFilter = async (updatedHighlightFilter: boolean): Promise<void> => {
    await serverState.updateSettings({ highlightFilter: updatedHighlightFilter }, dataId);
    updateSettings({ highlightFilter: updatedHighlightFilter }, () => setHighlightFilter(updatedHighlightFilter));
  };

  const dropFilter = async <T,>(
    prop: string,
    filters: Record<string, T>,
    setter: (value: Record<string, T>) => void,
    col: string,
  ): Promise<void> => {
    const updatedFilters = Object.keys(filters).reduce(
      (res, key) => (key !== col ? { ...res, [key]: filters[key] } : res),
      {},
    );
    const updatedSettings = { [prop]: updatedFilters };
    await serverState.updateSettings(updatedSettings, dataId);
    updateSettings(updatedSettings, () => setter(updatedFilters));
  };

  const clear = async (): Promise<void> => {
    await serverState.updateSettings({ query: '' }, dataId);
    updateSettings({ query: '' }, hideSidePanel);
  };

  const updateEngine = async (engine: QueryEngine): Promise<void> => {
    await serverState.updateQueryEngine(engine);
    setEngine(engine);
  };

  return (
    <div data-testid="filter-panel">
      {error}
      <div className="row">
        <div className="col-md-12">
          <div className="row m-0">
            <h1 className="mb-0">{t('Filters', { ns: 'filter' })}</h1>
            <div className="col" />
            <SidePanelButtons />
          </div>
          <div className="row m-0 pb-3">
            <div className="col p-0 font-weight-bold mt-auto">{t('Custom Filter', { ns: 'filter' })}</div>
            <PandasQueryHelp />
            <button className="btn btn-primary col-auto pt-2 pb-2" onClick={clear}>
              <span>{t('Clear', { ns: 'filter' })}</span>
            </button>
            <button className="btn btn-primary col-auto pt-2 pb-2" onClick={save}>
              <span>{t('Apply', { ns: 'filter' })}</span>
            </button>
          </div>
          <textarea
            style={{ width: '100%', height: 150 }}
            value={query || ''}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>
      <div className="row pt-3 pb-3">
        <span className="font-weight-bold col-auto pr-3">{t('Highlight Filtered Rows', { ns: 'main' })}</span>
        <Checkbox value={highlightFilter} setter={saveHighlightFilter} className="pt-1" />
      </div>
      <div className="row pt-3 pb-3">
        <span className="font-weight-bold col-auto pr-0">{t('Query Engine', { ns: 'filter' })}</span>
        <ButtonToggle
          className="ml-auto mr-3 font-weight-bold col"
          options={Object.values(QueryEngine).map((value) => ({ value }))}
          update={updateEngine}
          defaultValue={queryEngine}
        />
      </div>
      {(!!Object.keys(columnFilters ?? {}).length || !!Object.keys(outlierFilters ?? {}).length) && (
        <div className="row pb-5">
          <div className="col-md-6">
            <StructuredFilters
              label={t('Column Filters', { ns: 'filter' })}
              filters={columnFilters}
              dropFilter={(col: string) => dropFilter('columnFilters', columnFilters, setColumnFilters, col)}
            />
          </div>
          <div className="col-md-6">
            <StructuredFilters
              label={t('Outlier Filters', { ns: 'filter' })}
              filters={outlierFilters}
              dropFilter={(col: string) => dropFilter('outlierFilters', outlierFilters, setOutlierFilters, col)}
            />
          </div>
        </div>
      )}
      <div className="row">
        <div className="col-md-12">
          <QueryExamples />
        </div>
      </div>
      {contextVars.length > 0 && <ContextVariables contextVars={contextVars} />}
    </div>
  );
};

export default withTranslation(['filter', 'main'])(FilterPanel);
