import { TFunction } from 'i18next';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import ButtonToggle from '../../ButtonToggle';
import { BaseOption } from '../../redux/state/AppState';
import { capitalize } from '../../stringUtils';
import { rollingComps } from '../analysis/filters/Constants';

import { CreateColumnCodeSnippet } from './CodeSnippet';
import ColumnSelect from './ColumnSelect';
import {
  BaseCreateComponentProps,
  CreateColumnType,
  CreateColumnUpdateState,
  RollingClosedType,
  RollingConfig,
  RollingWindowType,
} from './CreateColumnState';
import { Checkbox } from './LabeledCheckbox';
import { LabeledSelect } from './LabeledSelect';

const buildWindowTypes = (t: TFunction): Array<BaseOption<RollingWindowType>> => [
  { value: RollingWindowType.TRIANG, label: t('builders:Triangular') },
  { value: RollingWindowType.GAUSSIAN, label: t('builders:Gaussian') },
];

export const validateRollingCfg = (t: TFunction, cfg: RollingConfig): string | undefined => {
  if (!cfg.col) {
    return t('builders:Please select a column!') ?? undefined;
  }
  if (!cfg.comp) {
    return t('builders:Please select a computation!') ?? undefined;
  }
  return undefined;
};

export const buildCode = (cfg: RollingConfig): CreateColumnCodeSnippet => {
  if (!cfg.col || !cfg.comp) {
    return undefined;
  }
  let rollingKwargs = [];
  if (cfg.min_periods) {
    rollingKwargs.push(`min_periods=${cfg.min_periods}`);
  }
  if (cfg.center) {
    rollingKwargs.push('center=True');
  }
  rollingKwargs = rollingKwargs.concat(cfg.win_type ? [`win_type='${cfg.win_type}'`] : []);
  rollingKwargs = rollingKwargs.concat(cfg.on ? [`on='${cfg.on}'`] : []);
  rollingKwargs = rollingKwargs.concat(cfg.closed ? [`closed='${cfg.closed}'`] : []);
  const rollingKwargsStr = rollingKwargs.length ? `, ${rollingKwargs.join(', ')}` : '';
  if (cfg.on) {
    return `df[['${cfg.col}', '${cfg.on}']].rolling(${cfg.window}${rollingKwargsStr}).${cfg.comp}()['${cfg.col}']`;
  }
  return `df['${cfg.col}'].rolling(${cfg.window}${rollingKwargsStr}).${cfg.comp}()`;
};

const CreateRolling: React.FC<BaseCreateComponentProps & WithTranslation> = ({
  namePopulated,
  columns,
  updateState,
  t,
}) => {
  const [windowTypes, compTypes] = React.useMemo(() => [buildWindowTypes(t), rollingComps(t)], [t]);
  const [col, setCol] = React.useState<BaseOption<string>>();
  const [comp, setComp] = React.useState<BaseOption<string>>();
  const [window, setWindow] = React.useState('5');
  const [minPeriods, setMinPeriods] = React.useState<string>();
  const [center, setCenter] = React.useState(false);
  const [winType, setWinType] = React.useState<BaseOption<RollingWindowType>>();
  const [on, setOn] = React.useState<BaseOption<string>>();
  const [closed, setClosed] = React.useState<RollingClosedType>();

  React.useEffect(() => {
    const cfg: RollingConfig = {
      col: col?.value,
      comp: comp?.value,
      window,
      min_periods: minPeriods,
      center,
      win_type: winType?.value,
      on: on?.value,
      closed,
    };
    const updatedState: CreateColumnUpdateState = {
      cfg: { type: CreateColumnType.ROLLING, cfg },
      code: buildCode(cfg),
    };
    if (!validateRollingCfg(t, cfg) && !namePopulated) {
      updatedState.name = `${cfg.col}_rolling_${cfg.comp}`;
    }
    updateState(updatedState);
  }, [col, comp, window, minPeriods, center, winType, on, closed]);

  return (
    <React.Fragment>
      <ColumnSelect
        label={`${t('builders:Column')}*`}
        prop="col"
        otherProps={['on']}
        parent={{ col, on }}
        updateState={(updates: { col?: BaseOption<string> }) => setCol(updates.col)}
        columns={columns}
        dtypes={['int', 'float']}
      />
      <LabeledSelect
        label={t('builders:Computation')}
        options={compTypes}
        value={comp}
        onChange={(selected) => setComp(selected as BaseOption<string>)}
      />
      <div className="form-group row">
        <label className="col-md-3 col-form-label text-right">{t('builders:Window')}</label>
        <div className="col-md-2">
          <input type="number" className="form-control" value={window} onChange={(e) => setWindow(e.target.value)} />
        </div>
        <label className="col-auto col-form-label text-right">{t('Min Periods', { ns: 'builders' })}</label>
        <div className="col-md-2">
          <input
            type="number"
            className="form-control"
            value={minPeriods ?? ''}
            onChange={(e) => setMinPeriods(e.target.value)}
          />
        </div>
        <label className="col-auto col-form-label text-right">{t('builders:Center')}</label>
        <div className="col-md-1 mt-auto mb-auto">
          <Checkbox value={center} setter={setCenter} />
        </div>
      </div>
      <ColumnSelect
        label={t('builders:On')}
        prop="on"
        otherProps={['col']}
        parent={{ col, on }}
        updateState={(updates: { on?: BaseOption<string> }) => setOn(updates.on)}
        columns={columns}
      />
      <LabeledSelect
        label={t('Window Type', { ns: 'builders' })}
        options={windowTypes}
        value={winType}
        onChange={(selected) => setWinType(selected as BaseOption<RollingWindowType>)}
        subLabel={`* ${t('builders:Required')}`}
        inputWidth={3}
      >
        <label className="col-auto col-form-label text-right ml-5">{t('builders:Closed')}</label>
        <div className="col-auto">
          <ButtonToggle
            options={Object.values(RollingClosedType).map((value) => ({ value, label: capitalize(value) }))}
            update={setClosed}
            defaultValue={closed}
            compact={false}
          />
        </div>
      </LabeledSelect>
    </React.Fragment>
  );
};

export default withTranslation(['builders', 'constants'])(CreateRolling);
