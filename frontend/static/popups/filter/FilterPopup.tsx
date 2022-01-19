import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import ButtonToggle from '../../ButtonToggle';
import { ColumnFilter, OutlierFilter } from '../../dtale/DataViewerState';
import * as serverState from '../../dtale/serverStateManagement';
import { AppActions } from '../../redux/actions/AppActions';
import { closeChart } from '../../redux/actions/charts';
import * as dtaleActions from '../../redux/actions/dtale';
import * as settingsActions from '../../redux/actions/settings';
import { AppState, CustomFilterPopupData, InstanceSettings, QueryEngine } from '../../redux/state/AppState';
import { RemovableError } from '../../RemovableError';
import * as CustomFilterRepository from '../../repository/CustomFilterRepository';

import ContextVariables from './ContextVariables';
import PandasQueryHelp from './PandasQueryHelp';
import QueryExamples from './QueryExamples';
import StructuredFilters from './StructuredFilters';

const FilterPopup: React.FC<WithTranslation> = ({ t }) => {
  const { dataId, chartData, queryEngine } = useSelector((state: AppState) => ({
    dataId: state.dataId,
    chartData: state.chartData as CustomFilterPopupData,
    queryEngine: state.queryEngine,
  }));
  const dispatch = useDispatch();
  const onClose = (): AppActions<void> => dispatch(closeChart(chartData));
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
    if (window.location.pathname.startsWith('/dtale/popup/filter')) {
      window.opener.location.reload();
      window.close();
    } else {
      updateSettings({ query }, onClose);
    }
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
    if (window.location.pathname.startsWith('/dtale/popup/filter')) {
      window.opener.location.reload();
    } else {
      updateSettings(updatedSettings, () => setter(updatedFilters));
    }
  };

  const clear = async (): Promise<void> => {
    await serverState.updateSettings({ query: '' }, dataId);
    if (window.location.pathname.startsWith('/dtale/popup/filter')) {
      window.opener.location.reload();
      window.close();
    } else {
      updateSettings({ query: '' }, onClose);
    }
  };

  const updateEngine = async (engine: QueryEngine): Promise<void> => {
    await serverState.updateQueryEngine(engine);
    setEngine(engine);
  };

  return (
    <React.Fragment>
      <div className="modal-body filter-modal">
        {error}
        <div className="row">
          <div className="col-md-7">
            <div className="row h-100">
              <div className="col-md-12 h-100">
                <StructuredFilters
                  label={t('Column Filters')}
                  filters={columnFilters}
                  dropFilter={(col: string) => dropFilter('columnFilters', columnFilters, setColumnFilters, col)}
                />
                <StructuredFilters
                  label={t('Outlier Filters')}
                  filters={outlierFilters}
                  dropFilter={(col: string) => dropFilter('outlierFilters', outlierFilters, setOutlierFilters, col)}
                />
                <div className="font-weight-bold pt-3 pb-3">{t('Custom Filter')}</div>
                <textarea
                  style={{ width: '100%', height: 150 }}
                  value={query || ''}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="col-md-5">
            <QueryExamples />
          </div>
        </div>
        <div className="row pb-0">
          <span className="font-weight-bold col-auto pr-0">Query Engine</span>
          <ButtonToggle
            className="ml-auto mr-3 font-weight-bold col"
            options={Object.values(QueryEngine).map((value) => ({ value }))}
            update={updateEngine}
            defaultValue={queryEngine}
          />
        </div>
        <div className="row">
          <div className="col-md-12">{contextVars.length > 0 && <ContextVariables contextVars={contextVars} />}</div>
        </div>
      </div>
      <div className="modal-footer">
        <PandasQueryHelp />
        <button className="btn btn-primary" onClick={clear}>
          <span>{t('Clear')}</span>
        </button>
        <button className="btn btn-primary" onClick={save}>
          <span>{t('Apply')}</span>
        </button>
      </div>
    </React.Fragment>
  );
};

export default withTranslation('filter')(FilterPopup);
