import { TFunction } from 'i18next';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { BaseOption } from '../../redux/state/AppState';

import { CreateColumnCodeSnippet } from './CodeSnippet';
import ColumnSelect from './ColumnSelect';
import {
  BaseCreateComponentProps,
  CreateColumnType,
  CreateColumnUpdateState,
  ZScoreNormalizeConfig,
} from './CreateColumnState';

export const validateZScoreNormalizeCfg = (t: TFunction, cfg: ZScoreNormalizeConfig): string | undefined => {
  if (!cfg.col) {
    return t('Please select a column to normalize!') ?? undefined;
  }
  return undefined;
};

export const buildCode = (cfg: ZScoreNormalizeConfig): CreateColumnCodeSnippet => {
  if (!cfg.col) {
    return undefined;
  }

  return `(df['${cfg.col}'] - data['${cfg.col}'].mean()) / data['${cfg.col}'].std(ddof=0)`;
};

const CreateZScoreNormalize: React.FC<BaseCreateComponentProps & WithTranslation> = ({
  namePopulated,
  columns,
  updateState,
  t,
}) => {
  const [col, setCol] = React.useState<BaseOption<string>>();

  React.useEffect(() => {
    const cfg: ZScoreNormalizeConfig = { col: col?.value };
    const updatedState: CreateColumnUpdateState = {
      cfg: { type: CreateColumnType.ZSCORE_NORMALIZE, cfg },
      code: buildCode(cfg),
    };
    if (cfg.col && !namePopulated) {
      updatedState.name = `${cfg.col}_normalize`;
    }
    updateState(updatedState);
  }, [col]);

  return (
    <ColumnSelect
      label={t('Col')}
      prop="col"
      parent={{ col }}
      updateState={(updates: { col?: BaseOption<string> }) => setCol(updates.col)}
      columns={columns}
      dtypes={['int', 'float']}
    />
  );
};

export default withTranslation('builders')(CreateZScoreNormalize);
