import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { BouncerWrapper } from '../../BouncerWrapper';
import { ColumnDef, DataViewerPropagateState } from '../../dtale/DataViewerState';
import { CloseChartAction } from '../../redux/actions/AppActions';
import { closeChart } from '../../redux/actions/charts';
import { AppState, CreateColumnPopupData } from '../../redux/state/AppState';
import { RemovableError } from '../../RemovableError';
import * as CreateColumnRepository from '../../repository/CreateColumnRepository';
import * as DtypesRepository from '../../repository/DtypesRepository';
import ColumnSaveType from '../replacement/ColumnSaveType';
import { buildForwardURL } from '../reshape/Reshape';

import CodeSnippet from './CodeSnippet';
import {
  CreateColumnConfigs,
  CreateColumnSaveParams,
  CreateColumnType,
  CreateColumnTypeGroup,
  CreateColumnUpdateState,
  OperandDataType,
  OutputType,
  PrepopulateCreateColumn,
  SaveAs,
  SaveAsProps,
} from './CreateColumnState';
import * as createUtils from './createUtils';
import { LabeledInput } from './LabeledInput';

require('./CreateColumn.css');

/** Component properties for CreateColumn */
export interface CreateColumnProps {
  prePopulated?: PrepopulateCreateColumn;
  propagateState?: DataViewerPropagateState;
}

const CreateColumn: React.FC<CreateColumnProps & WithTranslation> = ({ prePopulated, propagateState, t }) => {
  const { dataId, chartData } = useSelector((state: AppState) => ({
    dataId: state.dataId,
    chartData: state.chartData as CreateColumnPopupData,
  }));
  const dispatch = useDispatch();
  const onClose = (): CloseChartAction => dispatch(closeChart(chartData));

  const [columns, setColumns] = React.useState<ColumnDef[]>([]);
  const [error, setError] = React.useState<JSX.Element>();
  const [type, setType] = React.useState<CreateColumnType>(prePopulated?.type ?? CreateColumnType.NUMERIC);
  const [typeGroup, setTypeGroup] = React.useState<CreateColumnTypeGroup>(CreateColumnTypeGroup.AGGREGATING_COLUMNS);
  const [saveAs, setSaveAs] = React.useState<SaveAs>(prePopulated?.saveAs ?? SaveAs.NEW);
  const [name, setName] = React.useState<string>();
  const [namePopulated, setNamePopulated] = React.useState(false);
  const [cfg, setCfg] = React.useState<CreateColumnConfigs>(
    prePopulated
      ? { ...prePopulated }
      : {
          type: CreateColumnType.NUMERIC,
          cfg: { left: { type: OperandDataType.COL }, right: { type: OperandDataType.COL } },
        },
  );
  const [code, setCode] = React.useState<Record<CreateColumnType, string>>({} as Record<CreateColumnType, string>);
  const [loadingColumns, setLoadingColumns] = React.useState(true);
  const [loadingColumn, setLoadingColumn] = React.useState(false);

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

  React.useEffect(() => {
    setName(undefined);
  }, [type]);

  const save = (): void => {
    const createParams: CreateColumnSaveParams = { saveAs, ...cfg };
    if (saveAs === SaveAs.NEW) {
      if (!name) {
        setError(<RemovableError error="Name is required!" />);
        return;
      }
      if (columns.find((column) => column.name === name)) {
        setError(<RemovableError error={`The column '${name}' already exists!`} />);
        return;
      }
      createParams.name = name;
    }
    const validationError = createUtils.validateCfg(t, cfg);
    if (validationError) {
      setError(<RemovableError error={validationError} />);
      return;
    }
    setLoadingColumn(true);
    let route = 'build-column';
    if (type === CreateColumnType.RESAMPLE) {
      createParams.output = OutputType.NEW;
      route = 'reshape';
    }
    CreateColumnRepository.save(dataId, createParams, route).then((response) => {
      setLoadingColumn(false);
      if (response?.error) {
        setError(<RemovableError {...response} />);
        setLoadingColumn(false);
        return;
      }
      if (window.location.pathname.startsWith('/dtale/popup/build')) {
        window.opener.location.reload();
        window.close();
      } else if (route === 'reshape') {
        const newLoc = buildForwardURL(window.location.href, response?.data_id!);
        onClose();
        window.open(newLoc, '_blank');
        return;
      } else {
        propagateState?.({ refresh: true }, onClose);
      }
    });
  };

  const updateState = (state: CreateColumnUpdateState): void => {
    if (state.code) {
      setCode({ ...code, [type]: state.code });
    }
    setCfg(state.cfg ?? cfg);
    setName(state.name ?? name);
    setSaveAs(state.saveAs ?? saveAs);
  };

  const renderBody = (): JSX.Element => {
    const nameInput = createUtils.renderNameInput(cfg);
    const body = createUtils.getBody(type, columns, namePopulated, prePopulated, updateState);
    return (
      <div key="body" className="modal-body">
        {nameInput === 'name' && (
          <LabeledInput
            label={t('Name')}
            value={name}
            setter={(value) => {
              setName(value);
              setNamePopulated(value.length > 0);
            }}
          />
        )}
        {nameInput === 'name_inplace' && (
          <ColumnSaveType
            {...{ saveAs, name }}
            propagateState={(state: SaveAsProps) => {
              setSaveAs(state.saveAs ?? saveAs);
              setName(state.name ?? name);
              setNamePopulated(!!state.name?.length);
            }}
          />
        )}
        {prePopulated?.type === undefined &&
          createUtils.TYPE_GROUPS.map(({ buttons, label, className }, i) => (
            <div className={`form-group row mb-4 ${className ?? ''}`} key={i}>
              <label className="col-md-3 col-form-label text-right font-weight-bold">{t(label)}</label>
              <div className="col-md-8 builders">
                <div className="row">
                  {buttons.map((value, j) => {
                    const isExponentialSmoothing = value === CreateColumnType.EXPONENTIAL_SMOOTHING;
                    const buttonProps: React.HTMLAttributes<HTMLButtonElement> = {
                      className: `btn w-100 ${isExponentialSmoothing ? 'exponential-smoothing' : 'col-type'}`,
                    };
                    if (value === type) {
                      buttonProps.className += ' btn-primary active';
                    } else {
                      buttonProps.className += ' btn-light inactive pointer';
                      buttonProps.style = { ...buttonProps.style, border: 'solid 1px #a7b3b7' };
                      let updatedSaveAs = saveAs;
                      if (value !== CreateColumnType.TYPE_CONVERSION) {
                        updatedSaveAs = SaveAs.NEW;
                      }
                      buttonProps.onClick = () => {
                        setType(value as CreateColumnType);
                        setTypeGroup(label as CreateColumnTypeGroup);
                        setSaveAs(updatedSaveAs);
                      };
                    }
                    return (
                      <div key={`${i}-${j}`} className="col-md-3 p-1">
                        <button {...buttonProps}>{t(createUtils.buildLabel(value))}</button>
                      </div>
                    );
                  })}
                </div>
                {typeGroup === label && (
                  <label className="col-auto col-form-label pl-3 pr-3 pb-0 row" style={{ fontSize: '85%' }}>
                    {t(type)}
                  </label>
                )}
              </div>
            </div>
          ))}
        {body}
      </div>
    );
  };

  const codeMarkup = React.useMemo(() => {
    if (code[type]) {
      const codeArr = Array.isArray(code[type]) ? code[type] : [code[type]];
      const isWindow =
        codeArr.length > 2 && window.location.pathname.includes(`/dtale/popup/${type.split('_').join('-')}`);
      return <CodeSnippet code={codeArr} isWindow={isWindow} />;
    }
    return null;
  }, [code, type]);

  return (
    <React.Fragment>
      {error && (
        <div className="row" style={{ margin: '0 2em' }}>
          <div className="col-md-12">{error}</div>
        </div>
      )}
      <BouncerWrapper showBouncer={loadingColumns}>{renderBody()}</BouncerWrapper>
      <div className="modal-footer">
        {codeMarkup}
        <button className="btn btn-primary" onClick={loadingColumn ? () => undefined : save}>
          <BouncerWrapper showBouncer={loadingColumn}>
            <span>{t(saveAs === SaveAs.NEW ? 'Create' : 'Apply')}</span>
          </BouncerWrapper>
        </button>
      </div>
    </React.Fragment>
  );
};

export default withTranslation('builders')(CreateColumn);
