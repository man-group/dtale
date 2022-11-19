import React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { DataRecord, DataViewerData, DataViewerPropagateState } from '../dtale/DataViewerState';
import * as serverState from '../dtale/serverStateManagement';
import { CloseChartAction } from '../redux/actions/AppActions';
import { closeChart } from '../redux/actions/charts';
import { AppState, RenamePopupData } from '../redux/state/AppState';
import { RemovableError } from '../RemovableError';

require('./Confirmation.css');

/** Component properties for Rename */
interface RenameProps {
  propagateState: DataViewerPropagateState;
}

export const Rename: React.FC<RenameProps & WithTranslation> = ({ propagateState, t }) => {
  const { chartData, dataId } = useSelector((state: AppState) => ({
    chartData: state.chartData as RenamePopupData,
    dataId: state.dataId,
  }));
  const dispatch = useDispatch();

  const [name, setName] = React.useState<string>(chartData.selectedCol);
  const [error, setError] = React.useState<JSX.Element>();
  const { selectedCol, columns } = chartData;

  React.useEffect(() => {
    if (name !== selectedCol && columns.find((column) => column.name === name)) {
      setError(<RemovableError error={`Column with name "${name}" already exists!`} />);
    } else {
      setError(undefined);
    }
  }, [name]);

  const onClose = (): CloseChartAction => dispatch(closeChart(chartData));

  const renameAction = async (): Promise<void> => {
    const response = await serverState.renameColumn(dataId, selectedCol, name);
    if (response?.error) {
      setError(<RemovableError {...response} />);
      return;
    }
    const updatedColumns = columns.map((column) => ({ ...column, ...(column.name === selectedCol ? { name } : {}) }));
    const renameUpdate = (data: DataViewerData): DataViewerData =>
      Object.keys(data)
        .map(Number)
        .reduce((res: DataViewerData, key: number): DataViewerData => {
          const newRecord = { ...data[key], [name]: data[key][selectedCol] as DataRecord };
          delete newRecord[selectedCol];
          return { ...res, [key]: newRecord };
        }, {});
    propagateState({ columns: updatedColumns, renameUpdate });
    onClose();
  };

  return (
    <React.Fragment>
      <div className="modal-body">
        {error}
        <div className="form-group row">
          <label className="col-md-4 col-form-label text-right">{t('Current')}</label>
          <div className="col-md-6 mt-auto mb-auto font-weight-bold">{selectedCol}</div>
        </div>
        <div className="form-group row">
          <label className="col-md-4 col-form-label text-right">{t('New')}</label>
          <div className="col-md-6">
            <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="modal-footer confirmation">
        <button className="btn btn-primary" onClick={renameAction}>
          <span>{t('Update')}</span>
        </button>
        <button className="btn btn-secondary" onClick={onClose}>
          <span>{t('Cancel')}</span>
        </button>
      </div>
    </React.Fragment>
  );
};

export default withTranslation('rename')(Rename);
