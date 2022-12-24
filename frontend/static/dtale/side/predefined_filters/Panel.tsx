import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { AnyAction } from 'redux';

import { ColumnDef } from '../../../dtale/DataViewerState';
import { ActionType, HideSidePanelAction } from '../../../redux/actions/AppActions';
import * as settingsActions from '../../../redux/actions/settings';
import { AppState, InstanceSettings, PredefinedFilter } from '../../../redux/state/AppState';
import { RemovableError } from '../../../RemovableError';
import * as DtypesRepository from '../../../repository/DtypesRepository';
import * as serverState from '../../serverStateManagement';

import FilterInput from './FilterInput';

require('./Panel.css');

const filterFilters = (filters: PredefinedFilter[], columns: ColumnDef[]): PredefinedFilter[] =>
  filters.filter((f) => columns.find((col) => col.name === f.column) !== undefined);

const Panel: React.FC<WithTranslation> = ({ t }) => {
  const { dataId, predefinedFilters, filterValues } = useSelector((state: AppState) => ({
    dataId: state.dataId,
    predefinedFilters: state.predefinedFilters,
    filterValues: state.settings.predefinedFilters,
  }));
  const dispatch = useDispatch();
  const hideSidePanel = (): HideSidePanelAction => dispatch({ type: ActionType.HIDE_SIDE_PANEL });
  const updateSettings = (updatedSettings: Partial<InstanceSettings>): AnyAction =>
    dispatch(settingsActions.updateSettings(updatedSettings) as any as AnyAction);

  const [filters, setFilters] = React.useState<PredefinedFilter[]>([]);
  const [columns, setColumns] = React.useState<ColumnDef[]>([]);
  const [error, setError] = React.useState<JSX.Element>();

  React.useEffect(() => {
    DtypesRepository.loadDtypes(dataId).then((response) => {
      if (response?.error) {
        setError(<RemovableError {...response} />);
        return;
      }
      if (response) {
        setFilters(filterFilters(predefinedFilters, response.dtypes));
        setColumns(response.dtypes);
      }
    });
  }, []);

  const save = async (name: string, value: any | any[] | undefined, active: boolean): Promise<void> => {
    const updatedFilterValues = { ...filterValues };
    if (value) {
      updatedFilterValues[name] = { value, active };
    } else {
      updatedFilterValues[name] = { active };
    }
    const updatedSettings = { predefinedFilters: updatedFilterValues };
    await serverState.updateSettings(updatedSettings, dataId);
    updateSettings(updatedSettings);
  };

  const clearAll = async (): Promise<void> => {
    const updatedSettings = {
      predefinedFilters: Object.keys(filterValues).reduce(
        (res, key) => ({
          ...res,
          [key]: { ...filterValues[key], active: false },
        }),
        {},
      ),
    };
    await serverState.updateSettings(updatedSettings, dataId);
    updateSettings(updatedSettings);
  };

  return (
    <>
      {error}
      <div className="row ml-0 mr-0">
        <div className="col-auto pl-0">
          <h2>{t('Predefined Filters', { ns: 'menu' })}</h2>
        </div>
        <div className="col" />
        <div className="col-auto pr-0">
          <button className="btn btn-plain" onClick={hideSidePanel}>
            <i className="ico-close pointer" title={t('side:Close') ?? ''} />
          </button>
        </div>
      </div>
      <div className="row m-0 pb-3">
        <div className="col" />
        <button className="btn btn-primary col-auto pt-2 pb-2" onClick={clearAll}>
          <span>{t('Clear All', { ns: 'predefined' })}</span>
        </button>
      </div>
      {filters.map((f, i) => (
        <FilterInput key={i} dataId={dataId} filter={f} value={filterValues[f.name]} save={save} columns={columns} />
      ))}
    </>
  );
};

export default withTranslation(['menu', 'predefined', 'side'])(Panel);
