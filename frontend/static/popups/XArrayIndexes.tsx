import _ from 'lodash';
import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { createFilter, default as Select } from 'react-select';

import { DataViewerPropagateState, DataViewerState } from '../dtale/DataViewerState';
import { ActionType } from '../redux/actions/AppActions';
import { AppState, XArrayIndexesPopupData } from '../redux/state/AppState';
import { RemovableError } from '../RemovableError';
import * as XArrayRepository from '../repository/XArrayRepository';

/** Component properties for XArrayIndexes */
interface XArrayIndexesProps {
  propagateState: DataViewerPropagateState;
}

const XArrayIndexes: React.FC<XArrayIndexesProps & WithTranslation> = ({ propagateState, t }) => {
  const { dataId, chartData } = useSelector((state: AppState) => ({
    dataId: state.dataId,
    chartData: state.chartData as XArrayIndexesPopupData,
  }));
  const dispatch = useDispatch();

  const [index, setIndex] = React.useState<Array<{ value: string }>>(
    chartData.columns.filter((column) => column.locked).map((column) => ({ value: column.name })),
  );
  const [error, setError] = React.useState<JSX.Element>();

  const convert = async (): Promise<void> => {
    const columns = chartData.columns ?? [];
    const response = await XArrayRepository.toXarray(dataId, index);
    if (response?.error) {
      setError(<RemovableError {...response} />);
      return;
    }
    const newState: Partial<DataViewerState> = { refresh: true };
    if (index.find((i) => columns.find((column) => column.name === i.value && column.locked === false))) {
      newState.columns = columns.map((c) => ({
        ...c,
        locked: index.find((i) => i.value === c.name) !== undefined,
      }));
    }
    dispatch({ type: ActionType.CONVERT_TO_XARRAY });
    propagateState(newState);
  };

  const options: Array<{ value: string }> = _.sortBy(
    _.map(chartData.columns, (c) => ({ value: c.name })),
    ({ value }) => _.toLower(value),
  );
  return (
    <React.Fragment>
      <div className="modal-body">
        {error}
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">{t('Index', { ns: 'menu' })}</label>
          <div className="col-md-8">
            <div className="input-group">
              <Select
                className="Select is-clearable is-searchable Select--single"
                classNamePrefix="Select"
                options={options}
                getOptionLabel={(option: { value: string }) => option.value}
                getOptionValue={(option: { value: string }) => option.value}
                value={index}
                onChange={(selections) => setIndex(Array.isArray(selections) ? selections : [])}
                noOptionsMessage={() => t('No columns found', { ns: 'correlations' })}
                isClearable={true}
                isMulti={true}
                filterOption={createFilter({
                  ignoreAccents: false,
                })} // required for performance reasons!
              />
            </div>
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-primary" disabled={index.length === 0} onClick={convert}>
          <span>{t('Convert To XArray', { ns: 'menu' })}</span>
        </button>
      </div>
    </React.Fragment>
  );
};

export default withTranslation(['menu', 'correlations'])(XArrayIndexes);
