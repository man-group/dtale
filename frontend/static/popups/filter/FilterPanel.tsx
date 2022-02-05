import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import ButtonToggle from '../../ButtonToggle';
import { ColumnFilter, OutlierFilter } from '../../dtale/DataViewerState';
import * as serverState from '../../dtale/serverStateManagement';
import SidePanelButtons from '../../dtale/side/SidePanelButtons';
import { ActionType, AppActions, HideSidePanelAction } from '../../redux/actions/AppActions';
import * as dtaleActions from '../../redux/actions/dtale';
import * as settingsActions from '../../redux/actions/settings';
import { AppState, InstanceSettings, QueryEngine } from '../../redux/state/AppState';
import { RemovableError } from '../../RemovableError';
import * as CustomFilterRepository from '../../repository/CustomFilterRepository';

import ContextVariables from './ContextVariables';
import PandasQueryHelp from './PandasQueryHelp';
import QueryExamples from './QueryExamples';
import StructuredFilters from './StructuredFilters';

const FilterPanel: React.FC<WithTranslation> = ({ t }) => {
  const { dataId, queryEngine } = useSelector((state: AppState) => ({
    dataId: state.dataId,
    queryEngine: state.queryEngine,
  }));

  const dispatch = useDispatch();
  const hideSidePanel = (): HideSidePanelAction => dispatch({ type: ActionType.HIDE_SIDE_PANEL });
  const updateSettings = (updatedSettings: Partial<InstanceSettings>, callback?: () => void): AppActions<void> =>
    dispatch(settingsActions.updateSettings(updatedSettings, callback));
  const setEngine = (engine: QueryEngine): AppActions<void> => dispatch(dtaleActions.setQueryEngine(engine));

  const [query, setQuery] = React.useState('');
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
    <React.Fragment>
      {error}
      <div className="row">
        <div className="col-md-12">
          <div className="row m-0">
            <h1 className="mb-0">{t('Filters')}</h1>
            <div className="col" />
            <SidePanelButtons />
          </div>
          <div className="row m-0 pb-3">
            <div className="col p-0 font-weight-bold mt-auto">{t('Custom Filter')}</div>
            <PandasQueryHelp />
            <button className="btn btn-primary col-auto pt-2 pb-2" onClick={clear}>
              <span>{t('Clear')}</span>
            </button>
            <button className="btn btn-primary col-auto pt-2 pb-2" onClick={save}>
              <span>{t('Apply')}</span>
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
        <span className="font-weight-bold col-auto pr-0">Query Engine</span>
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
              label={t('Column Filters')}
              filters={columnFilters}
              dropFilter={(col: string) => dropFilter('columnFilters', columnFilters, setColumnFilters, col)}
            />
          </div>
          <div className="col-md-6">
            <StructuredFilters
              label={t('Outlier Filters')}
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
    </React.Fragment>
  );
};

export default withTranslation('filter')(FilterPanel);
