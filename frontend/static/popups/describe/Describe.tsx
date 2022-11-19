import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { BouncerWrapper } from '../../BouncerWrapper';
import { ColumnDef } from '../../dtale/DataViewerState';
import * as serverState from '../../dtale/serverStateManagement';
import { AppState, DescribePopupData } from '../../redux/state/AppState';
import { RemovableError } from '../../RemovableError';
import * as DtypesRepository from '../../repository/DtypesRepository';

import { ColumnNavigation } from './ColumnNavigation';
import { VisibilityState } from './DescribeState';
import Details from './Details';
import DtypesGrid from './DtypesGrid';

const Describe: React.FC<WithTranslation> = ({ t }) => {
  const { dataId, chartData } = useSelector((state: AppState) => ({
    dataId: state.dataId,
    chartData: state.chartData as DescribePopupData,
  }));

  const [loadingDtypes, setLoadingDtypes] = React.useState(true);
  const [error, setError] = React.useState<JSX.Element>();
  const [dtypes, setDtypes] = React.useState<ColumnDef[]>();
  const [selected, setSelected] = React.useState<ColumnDef>();
  const [visibility, setVisibility] = React.useState<VisibilityState>({} as VisibilityState);

  React.useEffect(() => {
    (async () => {
      const response = await DtypesRepository.loadDtypes(dataId);
      setLoadingDtypes(false);
      if (response?.error) {
        setError(<RemovableError {...response} />);
        return;
      }
      if (response) {
        setError(undefined);
        setDtypes(response.dtypes);
        if (response.dtypes.length) {
          setSelected(response.dtypes.find((col) => col.name === chartData.selectedCol) ?? response.dtypes[0]);
          setVisibility(response.dtypes.reduce((ret, d) => ({ ...ret, [d.name]: d.visible }), {}) as VisibilityState);
        }
      }
    })();
  }, []);

  if (error) {
    return (
      <div key="body" className="modal-body">
        {error}
      </div>
    );
  }

  const save = async (): Promise<void> => {
    await serverState.updateVisibility(dataId, visibility);
    window.opener.location.reload();
    window.close();
  };

  return (
    <React.Fragment>
      <div className="modal-body describe-body" data-testid="describe">
        {dtypes && selected && (
          <ColumnNavigation selectedIndex={selected.index} dtypes={dtypes} setSelected={setSelected} />
        )}
        <div className="row">
          <div className="col-md-5 describe-dtypes-grid-col">
            <BouncerWrapper showBouncer={loadingDtypes}>
              {!!dtypes?.length && (
                <DtypesGrid
                  dtypes={dtypes}
                  selected={selected}
                  setSelected={setSelected}
                  setVisibility={setVisibility}
                />
              )}
            </BouncerWrapper>
          </div>
          <div className="col-md-7 describe-details-col">
            {selected && <Details selected={selected} dtypes={dtypes ?? []} />}
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-primary" onClick={save}>
          <span>{t('Update Grid')}</span>
        </button>
      </div>
    </React.Fragment>
  );
};

export default withTranslation('describe')(Describe);
