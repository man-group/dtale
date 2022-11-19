import { TFunction } from 'i18next';
import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { BaseOption } from '../../redux/state/AppState';

import { CreateColumnCodeSnippet } from './CodeSnippet';
import ColumnSelect from './ColumnSelect';
import { BaseCreateComponentProps, CreateColumnType, CreateColumnUpdateState, StringConfig } from './CreateColumnState';
import { LabeledInput } from './LabeledInput';

export const validateStringCfg = (t: TFunction, cfg: StringConfig): string | undefined => {
  if ((cfg.cols?.length ?? 0) < 2) {
    return t('Please select at least 2 columns to concatenate!') ?? undefined;
  }
  return undefined;
};

export const buildCode = (cfg: StringConfig): CreateColumnCodeSnippet => {
  if ((cfg.cols?.length ?? 0) < 2) {
    return undefined;
  }

  return `df['${cfg.cols?.join("', '")}'].astype('str').agg('${cfg.joinChar}'.join, axis=1)`;
};

const CreateString: React.FC<BaseCreateComponentProps & WithTranslation> = ({
  namePopulated,
  columns,
  updateState,
  t,
}) => {
  const [cols, setCols] = React.useState<Array<BaseOption<string>>>();
  const [joinChar, setJoinChar] = React.useState('_');

  React.useEffect(() => {
    const cfg: StringConfig = { cols: cols?.map((col) => col.value), joinChar };
    const updatedState: CreateColumnUpdateState = { cfg: { type: CreateColumnType.STRING, cfg }, code: buildCode(cfg) };
    if (!validateStringCfg(t, cfg) && !namePopulated) {
      updatedState.name = `${cfg.cols?.join('_')}_concat`;
    }
    updateState(updatedState);
  }, [cols, joinChar]);

  return (
    <React.Fragment>
      <ColumnSelect
        label={t('Columns')}
        prop="cols"
        parent={{ cols }}
        updateState={(updates: { cols?: Array<BaseOption<string>> }) => setCols(updates.cols)}
        columns={columns}
        isMulti={true}
      />
      <LabeledInput label={t('Join Character')} value={joinChar} setter={setJoinChar} />
    </React.Fragment>
  );
};

export default withTranslation('builders')(CreateString);
