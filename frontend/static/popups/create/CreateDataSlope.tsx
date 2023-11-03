import { TFunction } from 'i18next';
import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { BaseOption } from '../../redux/state/AppState';

import { CreateColumnCodeSnippet } from './CodeSnippet';
import ColumnSelect from './ColumnSelect';
import {
  BaseCreateComponentProps,
  CreateColumnType,
  CreateColumnUpdateState,
  DataSlopeConfig,
} from './CreateColumnState';

export const validateDataSlopeCfg = (t: TFunction, cfg: DataSlopeConfig): string | undefined => {
  if (!cfg.col) {
    return t('Please select a column!') ?? undefined;
  }
  return undefined;
};

export const buildCode = (cfg: DataSlopeConfig): CreateColumnCodeSnippet => {
  if (!cfg.col) {
    return undefined;
  }

  return [
    `diffs = df['${cfg.col}'].diff().bfill()`,
    'diffs.loc[diffs < 0] = -1',
    'g = (~(diffs == diffs.shift(1))).cumsum()',
  ];
};

const CreateDataSlope: React.FC<BaseCreateComponentProps & WithTranslation> = ({
  namePopulated,
  columns,
  updateState,
  t,
}) => {
  const [col, setCol] = React.useState<BaseOption<string>>();

  React.useEffect(() => {
    const cfg: DataSlopeConfig = { col: col?.value };
    const updatedState: CreateColumnUpdateState = {
      cfg: { type: CreateColumnType.DATA_SLOPE, cfg },
      code: buildCode(cfg),
    };
    if (cfg.col && !namePopulated) {
      updatedState.name = `${cfg.col}_data_slope`;
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

export default withTranslation('builders')(CreateDataSlope);
