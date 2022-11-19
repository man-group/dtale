import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { BouncerWrapper } from '../../BouncerWrapper';
import ButtonToggle from '../../ButtonToggle';
import { ColumnDef } from '../../dtale/DataViewerState';
import { ColumnType, findColType, getDtype } from '../../dtale/gridUtils';
import { CloseChartAction } from '../../redux/actions/AppActions';
import { closeChart } from '../../redux/actions/charts';
import { AppState, BaseOption, ReplacementPopupData } from '../../redux/state/AppState';
import { RemovableError } from '../../RemovableError';
import * as CreateReplacementRepository from '../../repository/CreateReplacementRepository';
import * as DtypesRepository from '../../repository/DtypesRepository';
import CodeSnippet from '../create/CodeSnippet';
import { CreateColumnUpdateState, SaveAs } from '../create/CreateColumnState';
import * as PartialComponent from '../create/CreateReplace';

import ColumnSaveType from './ColumnSaveType';
import {
  CreateReplacementSaveParams,
  PartialReplacementConfig,
  ReplacementConfig,
  ReplacementType,
  ReplacementUpdateProps,
} from './CreateReplacementState';
import Imputer from './Imputer';
import Spaces from './Spaces';
import { default as Strings, validateStringsCfg } from './Strings';
import { validateValueCfg, default as Value } from './Value';

require('../create/CreateColumn.css');

const buildTypeFilter = (type: ReplacementType): ((colType: ColumnType) => boolean) => {
  switch (type) {
    case ReplacementType.SPACES:
    case ReplacementType.STRINGS:
    case ReplacementType.PARTIAL:
      return (colType) => colType === ColumnType.STRING;
    case ReplacementType.IMPUTER:
      return (colType) => [ColumnType.FLOAT, ColumnType.INT].includes(colType);
    case ReplacementType.VALUE:
    default:
      return () => true;
  }
};

const CreateReplacement: React.FC<WithTranslation> = ({ t }) => {
  const baseTypeOpts = React.useMemo(
    () => [
      { value: ReplacementType.VALUE, label: t('Value(s)', { ns: 'replacement' }) },
      { value: ReplacementType.SPACES, label: t('Spaces Only', { ns: 'replacement' }) },
      { value: ReplacementType.STRINGS, label: t('Contains Char/Substring', { ns: 'replacement' }) },
      { value: ReplacementType.IMPUTER, label: t('Scikit-Learn Imputer', { ns: 'replacement' }) },
      { value: ReplacementType.PARTIAL, label: t('Replace Substring', { ns: 'replacement' }) },
    ],
    [t],
  );
  const { dataId, chartData } = useSelector((state: AppState) => ({
    dataId: state.dataId,
    chartData: state.chartData as ReplacementPopupData,
  }));
  const dispatch = useDispatch();
  const onClose = (): CloseChartAction => dispatch(closeChart(chartData));

  const [type, setType] = React.useState<ReplacementType>();
  const [saveAs, setSaveAs] = React.useState(SaveAs.INPLACE);
  const [name, setName] = React.useState<string>();
  const [cfg, setCfg] = React.useState<ReplacementConfig>();
  const [code, setCode] = React.useState<Record<ReplacementType, string>>({} as Record<ReplacementType, string>);
  const [loadingColumns, setLoadingColumns] = React.useState(true);
  const [loadingReplacement, setLoadingReplacement] = React.useState(false);
  const [error, setError] = React.useState<JSX.Element>();
  const [columns, setColumns] = React.useState<ColumnDef[]>([]);
  const [colType, setColType] = React.useState<string>();
  const [typeOpts, setTypeOpts] = React.useState<Array<BaseOption<ReplacementType>>>([]);

  React.useEffect(() => {
    DtypesRepository.loadDtypes(dataId).then((response) => {
      setLoadingColumns(false);
      if (response?.error) {
        setError(<RemovableError {...response} />);
        return;
      }
      if (response) {
        setColumns(response.dtypes);
        const lowerDtype = (getDtype(chartData.selectedCol, response.dtypes) || '').toLowerCase();
        const currColType = findColType(lowerDtype);
        setColType(currColType);
        const currTypeOpts = baseTypeOpts.filter(({ value }) => buildTypeFilter(value)(currColType));
        setTypeOpts(currTypeOpts);
        if (currTypeOpts.length) {
          setType(currTypeOpts[0].value);
        }
      }
    });
  }, []);

  const save = async (): Promise<void> => {
    if (!cfg) {
      return;
    }
    const col = chartData.selectedCol;
    let cfgError;
    switch (cfg?.type) {
      case ReplacementType.STRINGS:
        cfgError = validateStringsCfg(t, cfg.cfg);
        break;
      case ReplacementType.PARTIAL:
        cfgError = PartialComponent.validateReplaceCfg(t, cfg.cfg);
        break;
      case ReplacementType.VALUE:
        cfgError = validateValueCfg(t, cfg.cfg);
        break;
      case ReplacementType.IMPUTER:
      case ReplacementType.SPACES:
      default:
        break;
    }
    const createParams: CreateReplacementSaveParams = { col, ...cfg, saveAs };
    if (saveAs === SaveAs.NEW) {
      if (!name) {
        cfgError = t('Please enter a name!');
      } else if (columns.find((c) => c.name === name)) {
        cfgError = `${t('A column already exists with the name,')} ${name}!`;
      } else {
        createParams.name = name;
      }
    }
    if (cfgError) {
      setError(<RemovableError error={cfgError} />);
      return;
    }
    setLoadingReplacement(true);
    CreateReplacementRepository.save(dataId, createParams).then((response) => {
      setLoadingReplacement(false);
      if (response?.error) {
        setError(<RemovableError {...response} />);
        return;
      }
      if (window.location.pathname.startsWith('/dtale/popup/build')) {
        window.opener.location.reload();
        window.close();
      } else {
        chartData.propagateState({ refresh: true }, onClose);
      }
    });
  };

  const renderBody = (): React.ReactNode => {
    if (!columns || !colType || !type) {
      return null;
    }
    const col = chartData.selectedCol;
    const updateState = (state: Partial<ReplacementUpdateProps>): void => {
      setCode({ ...code, [type]: state.code });
      setCfg(state.cfg);
      setError(state.error);
    };
    let body = null;
    switch (type) {
      case ReplacementType.SPACES:
        body = <Spaces {...{ col, colType, columns }} updateState={updateState} />;
        break;
      case ReplacementType.STRINGS:
        body = <Strings {...{ col, colType, columns }} updateState={updateState} />;
        break;
      case ReplacementType.PARTIAL:
        const updatePartial = (state: CreateColumnUpdateState): void => {
          const updatedState = {
            cfg: { type: ReplacementType.PARTIAL, cfg: state.cfg.cfg } as PartialReplacementConfig,
            code: state.code ? `df.loc[:, '${col}'] = ${state.code}` : undefined,
          };
          updateState(updatedState);
        };
        body = (
          <PartialComponent.default
            columns={columns}
            updateState={updatePartial}
            namePopulated={true}
            preselectedCol={col}
          />
        );
        break;
      case ReplacementType.IMPUTER:
        body = <Imputer {...{ col, colType, columns }} updateState={updateState} />;
        break;
      case ReplacementType.VALUE:
        body = <Value {...{ col, colType, columns }} updateState={updateState} />;
        break;
      default:
        break;
    }
    return (
      <div key="body" className="modal-body">
        <ColumnSaveType
          propagateState={(state) => {
            setSaveAs(state.saveAs);
            setName(state.name);
          }}
        />
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">{t('Replacement Type', { ns: 'replacement' })}</label>
          <div className="col-md-8">
            <ButtonToggle options={typeOpts} update={setType} defaultValue={type} compact={false} className="mr-0" />
            {<small className="d-block pt-3">{t(type, { ns: 'replacement' })}</small>}
          </div>
        </div>
        {body}
      </div>
    );
  };

  const codeMarkup = React.useMemo(() => {
    if (type && code[type]) {
      const codeArr = Array.isArray(code[type]) ? code[type] : [code[type]];
      const isWindow =
        codeArr?.length > 2 && window.location.pathname.includes(`/dtale/popup/${type.split('_').join('-')}`);
      return <CodeSnippet code={codeArr} isWindow={isWindow} />;
    }
    return null;
  }, [code, type]);

  return (
    <React.Fragment>
      {error && (
        <div key="error" className="row" style={{ margin: '0 2em' }}>
          <div className="col-md-12">{error}</div>
        </div>
      )}
      <BouncerWrapper showBouncer={loadingColumns}>{renderBody()}</BouncerWrapper>
      <div className="modal-footer">
        {codeMarkup}
        <button className="btn btn-primary" onClick={loadingColumns ? () => ({}) : save}>
          <BouncerWrapper showBouncer={loadingReplacement}>
            <span>{t('replacement:Replace')}</span>
          </BouncerWrapper>
        </button>
      </div>
    </React.Fragment>
  );
};

export default withTranslation(['reshape', 'replacement'])(CreateReplacement);
