import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
  AutoSizer as _AutoSizer,
  Column as _Column,
  Table as _Table,
  AutoSizerProps,
  ColumnProps,
  TableProps,
} from 'react-virtualized';

import { BouncerWrapper } from '../../BouncerWrapper';
import ColumnSelect from '../../popups/create/ColumnSelect';
import FilterableToggle from '../../popups/FilterableToggle';
import { ActionType, HideSidePanelAction } from '../../redux/actions/AppActions';
import { AppState, BaseOption } from '../../redux/state/AppState';
import { RemovableError } from '../../RemovableError';
import * as DtypesRepository from '../../repository/DtypesRepository';
import * as GageRnRRepository from '../../repository/GageRnRRepository';
import { ColumnDef } from '../DataViewerState';
import * as gu from '../gridUtils';

require('./GageRnR.css');

const AutoSizer = _AutoSizer as unknown as React.FC<AutoSizerProps>;
const Column = _Column as unknown as React.FC<ColumnProps>;
const Table = _Table as unknown as React.FC<TableProps>;

/** State properties for a Gage R & R report */
interface GageRnrState {
  operator?: Array<BaseOption<string>>;
  measurements?: Array<BaseOption<string>>;
  filtered: boolean;
}

const GageRnR: React.FC<WithTranslation> = ({ t }) => {
  const { dataId, settings } = useSelector((state: AppState) => ({ dataId: state.dataId, settings: state.settings }));
  const dispatch = useDispatch();
  const hideSidePanel = (): HideSidePanelAction => dispatch({ type: ActionType.HIDE_SIDE_PANEL });
  const hasFilters = React.useMemo(() => !gu.noFilters(settings), [settings]);
  const [loadingDtypes, setLoadingDtypes] = React.useState(true);
  const [error, setError] = React.useState<JSX.Element>();
  const [dtypes, setDtypes] = React.useState<ColumnDef[]>([]);
  const [state, setState] = React.useState<GageRnrState>({ filtered: !hasFilters });
  const [loadingReport, setLoadingReport] = React.useState(false);
  const [reportResults, setReportResults] = React.useState<GageRnRRepository.GageRnRReport>();

  React.useEffect(() => {
    DtypesRepository.loadDtypes(dataId).then((response) => {
      setLoadingDtypes(false);
      if (response?.error) {
        setError(<RemovableError {...response} />);
        return;
      }
      if (response) {
        setDtypes(response.dtypes);
      }
    });
  }, []);

  const loadReport = async (updates: Partial<GageRnrState>): Promise<void> => {
    const newState = { ...state, ...updates };
    if (!newState.operator?.length) {
      setState(newState);
      setLoadingReport(false);
      return;
    }
    setState(newState);
    setLoadingReport(true);
    GageRnRRepository.run(
      dataId,
      newState.operator ?? [],
      newState.measurements ?? [],
      newState.filtered ?? false,
    ).then((response) => {
      setLoadingReport(false);
      if (response?.error) {
        setError(<RemovableError {...response} />);
        return;
      }
      if (response) {
        setReportResults(response);
        setError(undefined);
      }
    });
  };

  return (
    <>
      {error}
      <div className="row ml-0 mr-0">
        <div className="col-auto pl-0">
          <h2>{t('gage_rnr', { ns: 'menu' })}</h2>
        </div>
        <div className="col" />
        <FilterableToggle hasFilters={hasFilters} {...state} propagateState={(updates) => loadReport(updates)} />
        <div className="col-auto">
          <button className="btn btn-plain" onClick={hideSidePanel}>
            <i className="ico-close pointer" title={t('side:Close') ?? ''} />
          </button>
        </div>
      </div>
      <BouncerWrapper showBouncer={loadingDtypes}>
        <div className="row ml-0 mr-0 missingno-inputs">
          <div className="col-md-12">
            <ColumnSelect
              isMulti={true}
              label={t('gage_rnr:Operator')}
              prop="operator"
              otherProps={['measurements']}
              parent={state}
              updateState={(updates: { operator?: Array<BaseOption<string>> }) => loadReport(updates)}
              columns={dtypes}
            />
          </div>
        </div>
        <div className="row ml-0 mr-0 missingno-inputs">
          <div className="col-md-12">
            <ColumnSelect
              isMulti={true}
              label={t('gage_rnr:Measurements')}
              prop="measurements"
              otherProps={['operator']}
              parent={state}
              updateState={(updates: { measurements?: Array<BaseOption<string>> }) => loadReport(updates)}
              columns={dtypes}
            />
          </div>
        </div>
        <BouncerWrapper showBouncer={loadingReport}>
          {state.operator && !!reportResults?.results.length && (
            <>
              <div className="gage-report-div">
                <AutoSizer>
                  {({ width }) => (
                    <Table
                      height={175}
                      rowStyle={{ display: 'flex' }}
                      headerHeight={gu.ROW_HEIGHT}
                      headerClassName="headerCell"
                      rowHeight={gu.ROW_HEIGHT}
                      rowGetter={({ index }) => reportResults.results[index]}
                      rowCount={reportResults.results.length}
                      width={width}
                      className="gage-report"
                    >
                      {reportResults.columns.map(({ name }, idx) => (
                        <Column
                          key={name}
                          dataKey={name}
                          label={name}
                          style={{ textAlign: 'center' }}
                          width={idx === 0 ? 300 : 200}
                          flexGrow={idx === 0 ? 1 : 0}
                          className="cell"
                        />
                      ))}
                    </Table>
                  )}
                </AutoSizer>
              </div>
              <p>{t('menu_description:gage_rnr')}</p>
            </>
          )}
          {state.operator && !reportResults?.results.length && <h3>No results found!</h3>}
        </BouncerWrapper>
      </BouncerWrapper>
    </>
  );
};

export default withTranslation(['side', 'menu', 'menu_description', 'gage_rnr'])(GageRnR);
