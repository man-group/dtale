import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { BouncerWrapper } from '../../BouncerWrapper';
import { ColumnDef } from '../../dtale/DataViewerState';
import { ActionType, OpenChartAction } from '../../redux/actions/AppActions';
import {
  AddDatasetAction,
  ClearErrorsAction,
  MergeActionType,
  RemoveDatasetAction,
  ToggleDatasetAction,
  UpdateDatasetAction,
} from '../../redux/actions/MergeActions';
import { BaseOption, PopupType } from '../../redux/state/AppState';
import { Dataset, MergeInstance, MergeState } from '../../redux/state/MergeState';
import { RemovableError } from '../../RemovableError';
import { LabeledInput } from '../create/LabeledInput';
import { LabeledSelect } from '../create/LabeledSelect';
import { Stat } from '../describe/Stat';
import Popup from '../Popup';

import ActionConfig from './ActionConfig';
import { DataPreview } from './DataPreview';
import MergeOutput from './MergeOutput';

require('./MergeDatasets.scss');

const datasetName = (instance: MergeInstance): string =>
  `${instance.data_id}${instance.name ? ` - ${instance.name}` : ''}`;

const colName = (col: ColumnDef): string => `${col.name} (${col.dtype})`;

const MergeDatasets: React.FC<WithTranslation> = ({ t }) => {
  const { instances, loading, loadingDatasets, action, datasets, loadingError, mergeError } = useSelector(
    (state: MergeState) => ({ ...state }),
  );
  const dispatch = useDispatch();
  const addDataset = (dataId: string): AddDatasetAction => dispatch({ type: MergeActionType.ADD_DATASET, dataId });
  const removeDataset = (index: number): RemoveDatasetAction =>
    dispatch({ type: MergeActionType.REMOVE_DATASET, index });
  const toggleDataset = (index: number): ToggleDatasetAction =>
    dispatch({ type: MergeActionType.TOGGLE_DATASET, index });
  const updateDataset = <T,>(index: number, prop: keyof Dataset, value: T): UpdateDatasetAction<T> =>
    dispatch({ type: MergeActionType.UPDATE_DATASET, index, prop, value });
  const clearErrors = (): ClearErrorsAction => dispatch({ type: MergeActionType.CLEAR_ERRORS });
  const openUpload = (): OpenChartAction =>
    dispatch({ type: ActionType.OPEN_CHART, chartData: { type: PopupType.UPLOAD, title: 'Upload', visible: true } });

  const renderDatasetInputs = (dataset: Dataset, datasetIndex: number): React.ReactNode => {
    const { dataId, isDataOpen } = dataset;
    const instance = instances.find(({ data_id }) => dataId === data_id);
    if (!instance) {
      return null;
    }
    const { name, rows, columns } = instance;
    const columnOptions = instance.names
      .sort((a: ColumnDef, b: ColumnDef): number => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
      .map((col) => ({ value: col, label: colName(col) }));
    return (
      <dl key={datasetIndex} className="dataset accordion pt-3">
        <dt
          className={`dataset accordion-title${dataset.isOpen ? ' is-expanded' : ''} pointer pl-3`}
          onClick={() => toggleDataset(datasetIndex)}
        >
          {`${t('Dataset')} ${datasetIndex + 1}`}
          <small>
            {` (${t('ID')}: ${instance.data_id}${name ? `, ${t('Name')}: ${name}` : ''}`}
            {`, ${t('Cols')}: ${columns}, ${t('Rows')}: ${rows})`}
          </small>
        </dt>
        <dd className={`p-0 dataset accordion-content${dataset.isOpen ? ' is-expanded' : ''}`}>
          <div className="row pt-4 ml-0 mr-0">
            {action === 'merge' && (
              <div className="col-md-6">
                <LabeledSelect
                  label={`${t('Index(es)*')}:`}
                  options={columnOptions}
                  placeholder={t('Select Indexes')}
                  value={dataset.index.map((col) => ({ value: col, label: colName(col) }))}
                  onChange={(indexes) =>
                    updateDataset(
                      datasetIndex,
                      'index',
                      ((indexes ?? []) as Array<BaseOption<ColumnDef>>).map(({ value }) => value),
                    )
                  }
                  isMulti={true}
                  labelWidth={2}
                />
              </div>
            )}
            <div className="col-md-6">
              <LabeledSelect
                label={`${t('Column(s)')}:`}
                options={columnOptions}
                placeholder={t('All Columns Selected')}
                value={dataset.index.map((col) => ({ value: col, label: colName(col) }))}
                onChange={(updatedColumns) =>
                  updateDataset(
                    datasetIndex,
                    'columns',
                    ((updatedColumns ?? []) as Array<BaseOption<ColumnDef>>).map(({ value }) => value),
                  )
                }
                isMulti={true}
                labelWidth={2}
              />
            </div>
            {action === 'merge' && (
              <div className="col-md-6">
                <LabeledInput
                  label={`${t('Suffix')}:`}
                  value={dataset.suffix ?? ''}
                  setter={(value) => updateDataset(datasetIndex, 'suffix', value)}
                  labelWidth={2}
                />
              </div>
            )}
            <div className="col-md-6 mb-auto mt-auto">
              <div className="row">
                <div className="col" />
                <div className="col-auto">
                  <button className="btn-sm btn-primary pointer" onClick={() => removeDataset(datasetIndex)}>
                    <i className="ico-remove-circle pr-3" />
                    <span>{t('Remove Dataset')}</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="col-md-12">
              <dl className="dataset accordion pt-3">
                <dt
                  className={`dataset accordion-title${isDataOpen ? ' is-expanded' : ''} pointer pl-3`}
                  onClick={() => updateDataset(datasetIndex, 'isDataOpen', !isDataOpen)}
                >
                  {t('Data')}
                </dt>
                <dd className={`p-0 dataset accordion-content${isDataOpen ? ' is-expanded' : ''} example`}>
                  <div className="row pt-4 ml-0 mr-0">
                    <div className="col-md-12" style={{ height: 200 }}>
                      <DataPreview dataId={`${dataId}`} />
                    </div>
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </dd>
      </dl>
    );
  };

  return (
    <React.Fragment>
      {loadingError && (
        <div className="ml-5 mr-5">
          <RemovableError {...loadingError} onRemove={clearErrors} />
        </div>
      )}
      {mergeError && (
        <div className="ml-5 mr-5">
          <RemovableError {...mergeError} onRemove={clearErrors} />
        </div>
      )}
      <ActionConfig />
      <BouncerWrapper showBouncer={loading}>
        <ul className="list-group ml-3 mr-3 pt-5" data-testid="merge-datasets">
          <li className="list-group-item p-3 section">
            <div className="row ml-0 mr-0">
              <div className="col-auto pl-4 pr-0">
                <h3 className="d-inline">{t('Dataset Selection')}</h3>
                <small>{t(` (Select By Clicking One of the Names Below)`)}</small>
              </div>
              <div className="col" />
              <div className="col-auto pr-0">
                <button className="btn-sm btn-primary mr-5 pointer" onClick={openUpload}>
                  <i className="ico-file-upload pr-3" />
                  <span>{t('Upload')}</span>
                </button>
              </div>
            </div>
            <div className="row ml-0 mr-0">
              <BouncerWrapper showBouncer={loadingDatasets}>
                {!loadingDatasets &&
                  instances.map((instance, i) => {
                    const buttonProps: React.HTMLAttributes<HTMLButtonElement> = {
                      className: 'btn w-100',
                      style: { padding: '0.45rem 0.3rem', color: '#111' },
                    };
                    buttonProps.className += ' btn-light inactive pointer hoverable';
                    buttonProps.style = { ...buttonProps.style, border: 'solid 1px #a7b3b7' };
                    buttonProps.onClick = () => addDataset(instance.data_id);
                    return (
                      <div key={i} className="col-md-3 p-1">
                        <button {...buttonProps}>
                          {datasetName(instance)}
                          <div className="hoverable__content pt-4 pl-0">
                            <ul>
                              <Stat t={t} field="Rows" value={instance.rows} />
                              <Stat t={t} field="Columns" value={instance.columns} />
                              <Stat
                                t={t}
                                field="Column Names"
                                value={`${instance.names.slice(0, 10).map(colName).join(', ')}${
                                  instance.names.length > 10 ? '...' : ''
                                }`}
                              />
                            </ul>
                          </div>
                        </button>
                      </div>
                    );
                  })}
              </BouncerWrapper>
            </div>
          </li>
        </ul>
        {!loading && (
          <div className="row p-4 ml-0 mr-0">
            <div className="col-md-12 p-0">{datasets.map(renderDatasetInputs)}</div>
          </div>
        )}
        {!loading && datasets.length > 1 && <MergeOutput />}
      </BouncerWrapper>
      <Popup propagateState={(_state, callback) => callback?.()} />
    </React.Fragment>
  );
};

export default withTranslation('merge')(MergeDatasets);
