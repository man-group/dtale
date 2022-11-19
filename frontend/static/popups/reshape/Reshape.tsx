import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { BouncerWrapper } from '../../BouncerWrapper';
import ButtonToggle from '../../ButtonToggle';
import { ColumnDef } from '../../dtale/DataViewerState';
import { CloseChartAction } from '../../redux/actions/AppActions';
import { closeChart } from '../../redux/actions/charts';
import { AppState, ReshapePopupData } from '../../redux/state/AppState';
import { RemovableError } from '../../RemovableError';
import * as DtypesRepository from '../../repository/DtypesRepository';
import * as ReshapeRepository from '../../repository/ReshapeRepository';
import CodeSnippet from '../create/CodeSnippet';
import { OutputType } from '../create/CreateColumnState';

import { default as Aggregate, validateAggregateCfg } from './Aggregate';
import { default as Pivot, validatePivotCfg } from './Pivot';
import { default as Resample, validateResampleCfg } from './Resample';
import { ReshapeConfigTypes, ReshapeSaveParams, ReshapeType, ReshapeUpdateState } from './ReshapeState';
import { default as Transpose, validateTransposeCfg } from './Transpose';

require('./Reshape.css');

export const buildForwardURL = (href: string, dataId: string): string => {
  const hrefSegs = (href || '').split('/');
  hrefSegs.pop();
  return `${hrefSegs.join('/')}/${dataId}`;
};

const Reshape: React.FC<WithTranslation> = ({ t }) => {
  const { dataId, chartData } = useSelector((state: AppState) => ({
    dataId: state.dataId,
    chartData: state.chartData as ReshapePopupData,
  }));
  const dispatch = useDispatch();
  const onClose = (): CloseChartAction => dispatch(closeChart(chartData));

  const [columns, setColumns] = React.useState<ColumnDef[]>([]);
  const [error, setError] = React.useState<JSX.Element>();
  const [type, setType] = React.useState(ReshapeType.PIVOT);
  const [output, setOutput] = React.useState(OutputType.NEW);
  const [cfg, setCfg] = React.useState<ReshapeConfigTypes>({});
  const [code, setCode] = React.useState<Record<ReshapeType, string>>({} as Record<ReshapeType, string>);
  const [loadingColumns, setLoadingColumns] = React.useState(true);
  const [loadingReshape, setLoadingReshape] = React.useState(false);

  React.useEffect(() => {
    DtypesRepository.loadDtypes(dataId).then((response) => {
      setLoadingColumns(false);
      if (response?.error) {
        setError(<RemovableError {...response} />);
        return;
      }
      setError(undefined);
      setColumns(response?.dtypes ?? []);
    });
  }, []);

  const save = (): void => {
    const createParams: ReshapeSaveParams = { cfg: cfg as any, type, output };
    let validationError = null;
    switch (createParams.type) {
      case ReshapeType.TRANSPOSE:
        validationError = validateTransposeCfg(createParams.cfg);
        break;
      case ReshapeType.AGGREGATE:
        validationError = validateAggregateCfg(createParams.cfg);
        break;
      case ReshapeType.RESAMPLE:
        validationError = validateResampleCfg(createParams.cfg);
        break;
      case ReshapeType.PIVOT:
      default:
        validationError = validatePivotCfg(createParams.cfg);
        break;
    }
    if (validationError) {
      setError(<RemovableError error={t(validationError) ?? ''} />);
      return;
    }
    setLoadingReshape(true);
    ReshapeRepository.save(dataId, createParams).then((response) => {
      setLoadingReshape(false);
      if (response?.error) {
        setError(<RemovableError {...response} />);
        setLoadingReshape(false);
        return;
      }
      if (response) {
        if (window.location.pathname.startsWith('/dtale/popup/reshape')) {
          window.opener.location.assign(buildForwardURL(window.opener.location.href, response.data_id));
          window.close();
          return;
        }
        const newLoc = buildForwardURL(window.location.href, response.data_id);
        if (output === 'new') {
          onClose();
          window.open(newLoc, '_blank');
          return;
        }
        window.location.assign(newLoc);
      }
    });
  };

  const updateState = (state: ReshapeUpdateState): void => {
    if (state.code) {
      setCode({ ...code, [type]: state.code });
    }
    setCfg(state.cfg ?? cfg);
  };

  return (
    <React.Fragment>
      {error && (
        <div className="row" style={{ margin: '0 2em' }}>
          <div className="col-md-12">{error}</div>
        </div>
      )}
      <BouncerWrapper showBouncer={loadingColumns}>
        <div key="body" className="modal-body">
          <div className="form-group row">
            <label className="col-md-3 col-form-label text-right">{t('Operation')}</label>
            <div className="col-md-8">
              <ButtonToggle
                options={[
                  { value: ReshapeType.AGGREGATE, label: <span className="d-block">{t('GroupBy')}</span> },
                  { value: ReshapeType.PIVOT, label: <span className="d-block">{t('Pivot')}</span>, className: 'p-3' },
                  { value: ReshapeType.TRANSPOSE, label: <span className="d-block">{t('Transpose')}</span> },
                  { value: ReshapeType.RESAMPLE, label: <span className="d-block">{t('Resample')}</span> },
                ]}
                update={setType}
                defaultValue={type}
                compact={false}
              />
            </div>
          </div>
          {type === ReshapeType.TRANSPOSE && <Transpose columns={columns} updateState={updateState} />}
          {type === ReshapeType.AGGREGATE && <Aggregate columns={columns} updateState={updateState} />}
          {type === ReshapeType.RESAMPLE && <Resample columns={columns} updateState={updateState} />}
          {type === ReshapeType.PIVOT && <Pivot columns={columns} updateState={updateState} />}
          <div className="form-group row">
            <label className="col-md-3 col-form-label text-right">{t('Output')}</label>
            <div className="col-md-8">
              <ButtonToggle
                options={[
                  { value: OutputType.NEW, label: t('New Instance') },
                  { value: OutputType.OVERRIDE, label: t('Override Current') },
                ]}
                update={setOutput}
                defaultValue={output}
                compact={false}
              />
            </div>
          </div>
        </div>
      </BouncerWrapper>
      <div className="modal-footer">
        <CodeSnippet code={code[type]} />
        <button className="btn btn-primary" onClick={loadingReshape ? () => undefined : save}>
          <BouncerWrapper showBouncer={loadingReshape}>
            <span>{t('Execute')}</span>
          </BouncerWrapper>
        </button>
      </div>
    </React.Fragment>
  );
};

export default withTranslation('reshape')(Reshape);
