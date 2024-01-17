import { createSelector, PayloadAction } from '@reduxjs/toolkit';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { BouncerWrapper } from '../../BouncerWrapper';
import { usePrevious } from '../../customHooks';
import { ColumnNavigation } from '../../popups/describe/ColumnNavigation';
import Details from '../../popups/describe/Details';
import DtypesGrid from '../../popups/describe/DtypesGrid';
import { AppActions } from '../../redux/actions/AppActions';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  selectDataId,
  selectSidePanelColumn,
  selectSidePanelView,
  selectSidePanelVisible,
} from '../../redux/selectors';
import { DataViewerUpdate, DataViewerUpdateType, SidePanelType } from '../../redux/state/AppState';
import { RemovableError } from '../../RemovableError';
import * as DtypesRepository from '../../repository/DtypesRepository';
import { ColumnDef } from '../DataViewerState';
import * as serverState from '../serverStateManagement';

import SidePanelButtons from './SidePanelButtons';

const selectResult = createSelector(
  [selectDataId, selectSidePanelVisible, selectSidePanelView, selectSidePanelColumn],
  (dataId, visible, view, column) => ({ dataId, visible, view, column }),
);

const DescribePanel: React.FC<WithTranslation> = ({ t }) => {
  const { dataId, visible, view, column } = useAppSelector(selectResult);
  const prevColumn = usePrevious(column);
  const dispatch = useAppDispatch();
  const toggleVisible = (columns: Record<string, boolean>): PayloadAction<DataViewerUpdate> =>
    dispatch(AppActions.DataViewerUpdateAction({ type: DataViewerUpdateType.TOGGLE_COLUMNS, columns }));

  const [loadingDtypes, setLoadingDtypes] = React.useState(true);
  const [error, setError] = React.useState<JSX.Element>();
  const [dtypes, setDtypes] = React.useState<ColumnDef[]>([]);
  const [dtypeLoad, setDtypeLoad] = React.useState<Date>();
  const [visibility, setVisibility] = React.useState<Record<string, boolean>>({});
  const [selected, setSelected] = React.useState<ColumnDef>();

  React.useEffect(() => {
    if (view !== SidePanelType.DESCRIBE && view !== SidePanelType.SHOW_HIDE) {
      return;
    }
    const now = new Date();
    if (!dtypeLoad || Math.ceil(((now.valueOf() - dtypeLoad.valueOf()) / 1000) * 60) > 5) {
      setLoadingDtypes(true);
      DtypesRepository.loadDtypes(dataId).then((response) => {
        setLoadingDtypes(false);
        setDtypeLoad(now);
        if (response?.error) {
          setError(<RemovableError {...response} />);
          return;
        }
        if (response) {
          setDtypes(response.dtypes);
          setSelected(response.dtypes.find(({ name }) => name === column));
          setVisibility(response.dtypes.reduce((ret, d) => ({ ...ret, [d.name]: d.visible }), {}));
        }
      });
    } else if (column !== prevColumn) {
      setSelected(dtypes.find(({ name }) => name === column));
    }
  }, [view, column, visible]);

  if (view !== SidePanelType.DESCRIBE && view !== SidePanelType.SHOW_HIDE) {
    return null;
  }
  const save = async (): Promise<void> => {
    await serverState.updateVisibility(dataId, visibility);
    toggleVisible(visibility);
  };
  return (
    <React.Fragment>
      {error}
      <BouncerWrapper showBouncer={loadingDtypes}>
        {view === SidePanelType.DESCRIBE && selected && (
          <React.Fragment>
            <ColumnNavigation
              dtypes={dtypes}
              selectedIndex={selected.index}
              setSelected={(updatedSelection) => setSelected(updatedSelection)}
            />
            <Details
              selected={selected}
              dtypes={dtypes}
              close={
                <>
                  <SidePanelButtons />
                  <div style={{ paddingRight: '15px' }} />
                </>
              }
            />
          </React.Fragment>
        )}
        {view === SidePanelType.SHOW_HIDE && (
          <>
            <div className="row m-0 pb-3">
              <button className="btn btn-primary col-auto pt-2 pb-2" onClick={save}>
                <span>{t('Save Visibility')}</span>
              </button>
              <div className="col" />
              <SidePanelButtons />
            </div>
            <div style={{ height: 'calc(100vh - 100px)' }}>
              <DtypesGrid {...{ dtypes, selected, setSelected, setVisibility }} />
            </div>
          </>
        )}
      </BouncerWrapper>
    </React.Fragment>
  );
};

export default withTranslation(['side'])(DescribePanel);
