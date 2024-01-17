import { createSelector } from '@reduxjs/toolkit';
import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { BouncerWrapper } from '../../BouncerWrapper';
import ButtonToggle from '../../ButtonToggle';
import { ColumnDef } from '../../dtale/DataViewerState';
import { useAppSelector } from '../../redux/hooks';
import { selectChartData, selectDataId } from '../../redux/selectors';
import { DuplicatesPopupData } from '../../redux/state/AppState';
import { RemovableError } from '../../RemovableError';
import * as DtypesRepository from '../../repository/DtypesRepository';
import * as DuplicatesRepository from '../../repository/DuplicatesRepository';
import { buildForwardURL } from '../reshape/utils';

import ColumnNames from './ColumnNames';
import Columns from './Columns';
import { DuplicatesActionType, DuplicatesConfigs, DuplicatesConfigType, KeepType } from './DuplicatesState';
import { default as Rows, validateRowsCfg } from './Rows';
import { default as ShowDuplicates, validateShowDuplicatesCfg } from './ShowDuplicates';

require('./Duplicates.css');

const TYPE_DESC: { [k in DuplicatesConfigType]?: string } = {
  [DuplicatesConfigType.COLUMNS]: 'Remove columns that contain the same data.',
  [DuplicatesConfigType.COLUMN_NAMES]: 'Remove columns with the same name (case-insensitive)',
  [DuplicatesConfigType.ROWS]: 'Remove duplicate rows based on a subset of columns.',
  [DuplicatesConfigType.SHOW]: 'Show all duplicates data or duplicate data for a specific value.',
};

const selectResult = createSelector([selectDataId, selectChartData], (dataId, chartData) => ({
  chartData: chartData as DuplicatesPopupData,
  dataId,
}));

const Duplicates: React.FC<WithTranslation> = ({ t }) => {
  const { dataId, chartData } = useAppSelector(selectResult);
  const [error, setError] = React.useState<JSX.Element>();
  const [loadingColumns, setLoadingColumns] = React.useState(true);
  const [columns, setColumns] = React.useState<ColumnDef[]>([]);
  const [type, setType] = React.useState(
    chartData.selectedCol ? DuplicatesConfigType.ROWS : DuplicatesConfigType.COLUMNS,
  );
  const [cfg, setCfg] = React.useState<DuplicatesConfigs>(
    chartData.selectedCol
      ? { type: DuplicatesConfigType.ROWS, cfg: { subset: [chartData.selectedCol], keep: KeepType.FIRST } }
      : { type: DuplicatesConfigType.COLUMNS, cfg: { keep: KeepType.FIRST } },
  );
  const [executing, setExecuting] = React.useState(false);

  React.useEffect(() => {
    DtypesRepository.loadDtypes(dataId).then((response) => {
      setLoadingColumns(false);
      if (response?.error) {
        setError(<RemovableError {...response} />);
        return;
      }
      if (response) {
        setColumns(response.dtypes);
      }
    });
  }, []);

  const execute = async (): Promise<void> => {
    let validationError: string | undefined;
    switch (cfg.type) {
      case DuplicatesConfigType.ROWS:
        validationError = validateRowsCfg(cfg.cfg);
        break;
      case DuplicatesConfigType.SHOW:
        validationError = validateShowDuplicatesCfg(cfg.cfg);
        break;
      case DuplicatesConfigType.COLUMNS:
      case DuplicatesConfigType.COLUMN_NAMES:
      default:
        break;
    }
    if (validationError) {
      setError(<RemovableError error={t(validationError)} />);
      return;
    }
    setExecuting(true);
    DuplicatesRepository.run<DuplicatesRepository.ExecuteDuplicates>(dataId, {
      ...cfg,
      action: DuplicatesActionType.EXECUTE,
    }).then((response) => {
      setExecuting(false);
      if (response?.error) {
        setError(<RemovableError {...response} />);
        return;
      }
      if (response) {
        if (window.location.pathname.startsWith('/dtale/popup/duplicates')) {
          window.opener.location.assign(buildForwardURL(window.opener.location.href, response.data_id));
          window.close();
          return;
        }
        window.location.assign(buildForwardURL(window.location.href, response.data_id));
      }
    });
  };

  return (
    <React.Fragment>
      <div className="modal-body">
        {error && (
          <div className="row" style={{ margin: '0 2em' }}>
            <div className="col-md-12">{error}</div>
          </div>
        )}
        <BouncerWrapper showBouncer={loadingColumns}>
          <div className="form-group row">
            <label className="col-md-3 col-form-label text-right">{t('Operation')}</label>
            <div className="col-md-8">
              <ButtonToggle
                options={[
                  { value: DuplicatesConfigType.COLUMNS, label: t('Remove\nDuplicate Columns') },
                  { value: DuplicatesConfigType.COLUMN_NAMES, label: t('Remove Duplicate\nColumn Names') },
                  { value: DuplicatesConfigType.ROWS, label: t('Remove\nDuplicate Rows') },
                  { value: DuplicatesConfigType.SHOW, label: t('Show\nDuplicates') },
                ]}
                update={setType}
                defaultValue={type}
                compact={false}
                className="duplicate-types"
              />
              {type && <small className="d-block pt-3">{t(TYPE_DESC[type] ?? '')}</small>}
            </div>
          </div>
          {type === DuplicatesConfigType.COLUMNS && <Columns setCfg={setCfg} />}
          {type === DuplicatesConfigType.COLUMN_NAMES && <ColumnNames setCfg={setCfg} />}
          {type === DuplicatesConfigType.ROWS && (
            <Rows selectedCol={chartData.selectedCol} columns={columns} setCfg={setCfg} />
          )}
          {type === DuplicatesConfigType.SHOW && <ShowDuplicates columns={columns} setCfg={setCfg} />}
        </BouncerWrapper>
      </div>
      <div className="modal-footer">
        <button className="btn btn-primary" onClick={executing ? () => ({}) : execute}>
          <BouncerWrapper showBouncer={executing}>
            <span>{t('Execute')}</span>
          </BouncerWrapper>
        </button>
      </div>
    </React.Fragment>
  );
};

export default withTranslation('duplicate')(Duplicates);
