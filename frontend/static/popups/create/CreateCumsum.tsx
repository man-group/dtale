import { TFunction } from 'i18next';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { BaseOption } from '../../redux/state/AppState';

import { CreateColumnCodeSnippet } from './CodeSnippet';
import ColumnSelect from './ColumnSelect';
import { BaseCreateComponentProps, CreateColumnType, CreateColumnUpdateState, CumsumConfig } from './CreateColumnState';

export const validateCumsumCfg = (t: TFunction, cfg: CumsumConfig): string | undefined => {
  if (!cfg.cols?.length) {
    return t('Please select a column!') ?? undefined;
  }
  return undefined;
};

export const buildCode = (cfg: CumsumConfig): CreateColumnCodeSnippet => {
  if (!cfg.cols?.length) {
    return undefined;
  }

  const colChunks = [];
  const chunkSize = 4;
  for (let i = 0; i < cfg.cols.length; i += chunkSize) {
    colChunks.push(cfg.cols.slice(i, i + chunkSize));
  }

  if (colChunks.length > 1) {
    if (!!cfg.group?.length) {
      return [
        `df.groupby(['${cfg.group.join("', '")}'])[[`,
        ...colChunks.map((cols) => `\t'${cols.join("', '")}',`),
        ']].cumsum(axis=0)',
      ];
    }

    return [`df[[`, ...colChunks.map((cols) => `\t'${cols.join("', '")}',`), ']].cumsum(axis=0)'];
  }

  if (!!cfg.group?.length) {
    return `df.groupby(['${cfg.group.join("', '")}'])[['${cfg.cols.join("', '")}']].cumsum(axis=0)`;
  }

  return `df[['${cfg.cols.join("', '")}']].cumsum(axis=0)`;
};

const CreateCumsum: React.FC<BaseCreateComponentProps & WithTranslation> = ({
  namePopulated,
  columns,
  updateState,
  t,
}) => {
  const [cols, setCols] = React.useState<Array<BaseOption<string>>>();
  const [group, setGroup] = React.useState<Array<BaseOption<string>>>();

  React.useEffect(() => {
    const cfg: CumsumConfig = {
      group: group?.map((option) => option.value),
      cols: cols?.map((option) => option.value),
    };
    const updatedState: CreateColumnUpdateState = { cfg: { type: CreateColumnType.CUMSUM, cfg }, code: buildCode(cfg) };
    if (cfg.cols?.length && !namePopulated) {
      updatedState.name = '_cumsum';
    }
    updateState(updatedState);
  }, [cols, group]);

  return (
    <React.Fragment>
      <ColumnSelect
        label={t('Column(s)')}
        prop="cols"
        otherProps={['group']}
        parent={{ cols, group }}
        updateState={(updates: { cols?: Array<BaseOption<string>> }) => setCols(updates.cols)}
        columns={columns}
        dtypes={['int', 'float']}
        isMulti={true}
        selectAll={true}
      />
      <ColumnSelect
        label={t('Group By')}
        prop="group"
        otherProps={['cols']}
        parent={{ cols, group }}
        updateState={(updates: { group?: Array<BaseOption<string>> }) => setGroup(updates.group)}
        columns={columns}
        isMulti={true}
      />
    </React.Fragment>
  );
};

export default withTranslation('builders')(CreateCumsum);
