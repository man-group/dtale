import { TFunction } from 'i18next';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { BaseOption } from '../../redux/state/AppState';

import { CreateColumnCodeSnippet } from './CodeSnippet';
import ColumnSelect from './ColumnSelect';
import { BaseCreateComponentProps, CreateColumnType, CreateColumnUpdateState, CumsumConfig } from './CreateColumnState';

export const validateCumsumCfg = (t: TFunction, cfg: CumsumConfig): string | undefined => {
  if (!cfg.col) {
    return t('Please select a column!') ?? undefined;
  }
  return undefined;
};

export const buildCode = (cfg: CumsumConfig): CreateColumnCodeSnippet => {
  if (!cfg.col) {
    return undefined;
  }

  if (!!cfg.group?.length) {
    return `df.groupby(['${cfg.group.join("', '")}'])['${cfg.col}'].cumsum(axis=0)`;
  }

  return `df['${cfg.col}'].cumsum(axis=0)`;
};

const CreateCumsum: React.FC<BaseCreateComponentProps & WithTranslation> = ({
  namePopulated,
  columns,
  updateState,
  t,
}) => {
  const [col, setCol] = React.useState<BaseOption<string>>();
  const [group, setGroup] = React.useState<Array<BaseOption<string>>>();

  React.useEffect(() => {
    const cfg: CumsumConfig = {
      group: group?.map((option) => option.value),
      col: col?.value,
    };
    const updatedState: CreateColumnUpdateState = { cfg: { type: CreateColumnType.CUMSUM, cfg }, code: buildCode(cfg) };
    if (cfg.col && !namePopulated) {
      updatedState.name = `${cfg.col}_cumsum`;
    }
    updateState(updatedState);
  }, [col, group]);

  return (
    <React.Fragment>
      <ColumnSelect
        label={t('Col')}
        prop="col"
        otherProps={['group']}
        parent={{ col, group }}
        updateState={(updates: { col?: BaseOption<string> }) => setCol(updates.col)}
        columns={columns}
        dtypes={['int', 'float']}
      />
      <ColumnSelect
        label={t('Group By')}
        prop="group"
        otherProps={['col']}
        parent={{ col, group }}
        updateState={(updates: { group?: Array<BaseOption<string>> }) => setGroup(updates.group)}
        columns={columns}
        isMulti={true}
      />
    </React.Fragment>
  );
};

export default withTranslation('builders')(CreateCumsum);
