import { TFunction } from 'i18next';
import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { getDtype, isStringCol } from '../../dtale/gridUtils';
import { BaseOption } from '../../redux/state/AppState';

import { CreateColumnCodeSnippet } from './CodeSnippet';
import ColumnSelect from './ColumnSelect';
import { BaseCreateComponentProps, CreateColumnType, CreateColumnUpdateState, ShiftConfig } from './CreateColumnState';
import { LabeledInput } from './LabeledInput';

export const validateShiftCfg = (t: TFunction, cfg: ShiftConfig): string | undefined => {
  if (!cfg.col) {
    return t('Please select a column!') ?? undefined;
  }
  return undefined;
};

export const buildCode = (cfg: ShiftConfig): CreateColumnCodeSnippet => {
  if (!cfg.col) {
    return undefined;
  }
  let kwargs = '';
  if (cfg.fillValue !== undefined) {
    kwargs = isStringCol(cfg.dtype) ? `, fill_value='${cfg.fillValue}'` : `, fill_value=${cfg.fillValue}`;
  }
  return `df['${cfg.col}'].shift(${cfg.periods || 1}${kwargs})`;
};

const CreateShift: React.FC<BaseCreateComponentProps & WithTranslation> = ({
  namePopulated,
  columns,
  updateState,
  t,
}) => {
  const [col, setCol] = React.useState<BaseOption<string>>();
  const [periods, setPeriods] = React.useState(1);
  const [fillValue, setFillValue] = React.useState<string>();

  React.useEffect(() => {
    const cfg: ShiftConfig = { col: col?.value, periods, fillValue, dtype: getDtype(col?.value, columns) };
    const updatedState: CreateColumnUpdateState = { cfg: { type: CreateColumnType.SHIFT, cfg }, code: buildCode(cfg) };
    if (cfg.col && !namePopulated) {
      updatedState.name = `${cfg.col}_shift`;
    }
    updateState(updatedState);
  }, [col, periods, fillValue]);

  return (
    <React.Fragment>
      <ColumnSelect
        label={t('Col')}
        prop="col"
        parent={{ col }}
        updateState={(updates: { col?: BaseOption<string> }) => setCol(updates.col)}
        columns={columns}
      />
      <LabeledInput type="number" label={t('Periods')} value={periods} setter={(value) => setPeriods(Number(value))} />
      <LabeledInput label={t('Fill Value')} value={fillValue} setter={setFillValue} />
    </React.Fragment>
  );
};

export default withTranslation('builders')(CreateShift);
