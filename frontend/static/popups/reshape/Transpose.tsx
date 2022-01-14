import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { BaseOption } from '../../redux/state/AppState';
import { CreateColumnCodeSnippet } from '../create/CodeSnippet';
import ColumnSelect from '../create/ColumnSelect';

import { BaseReshapeComponentProps, ReshapeTransposeConfig } from './ReshapeState';

export const validateTransposeCfg = (cfg: ReshapeTransposeConfig): string | undefined => {
  if (!cfg.index?.length) {
    return 'Missing an index selection!';
  }
  return undefined;
};

export const buildCode = (cfg: ReshapeTransposeConfig): CreateColumnCodeSnippet => {
  if (!cfg.index?.length) {
    return undefined;
  }
  let code = `df.set_index(['${cfg.index.join("', '")}'])`;
  if (cfg.columns?.length) {
    code += `[['${cfg.columns.join("', '")}']]`;
  }
  code += '.T';
  return code;
};

const Transpose: React.FC<BaseReshapeComponentProps & WithTranslation> = ({ updateState, t, ...props }) => {
  const [index, setIndex] = React.useState<Array<BaseOption<string>>>();
  const [columns, setColumns] = React.useState<Array<BaseOption<string>>>();

  React.useEffect(() => {
    const cfg: ReshapeTransposeConfig = {
      index: index?.map(({ value }) => value),
      columns: columns?.map(({ value }) => value),
    };
    updateState({ cfg, code: buildCode(cfg) });
  }, [index, columns]);

  return (
    <React.Fragment>
      <ColumnSelect
        label={t('Index')}
        prop="index"
        otherProps={['columns']}
        parent={{ index, columns }}
        updateState={(updatedState) => setIndex(updatedState.index as Array<BaseOption<string>>)}
        columns={props.columns}
        isMulti={true}
      />
      <ColumnSelect
        label={t('Column(s)')}
        prop="columns"
        otherProps={['index']}
        parent={{ index, columns }}
        updateState={(updatedState) => setColumns(updatedState.columns as Array<BaseOption<string>>)}
        columns={props.columns}
        isMulti={true}
      />
    </React.Fragment>
  );
};

export default withTranslation('reshape')(Transpose);
