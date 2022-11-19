import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import {
  AutoSizer as _AutoSizer,
  Column as _Column,
  Table as _Table,
  AutoSizerProps,
  ColumnProps,
  TableProps,
} from 'react-virtualized';

import * as gu from '../../dtale/gridUtils';

require('./ContextVariables.css');

const AutoSizer = _AutoSizer as unknown as React.FC<AutoSizerProps>;
const Column = _Column as unknown as React.FC<ColumnProps>;
const Table = _Table as unknown as React.FC<TableProps>;

/** Component properties for ContextVariables */
interface ContextVariablesProps {
  contextVars: Array<{ name: string; value: string }>;
}

const ContextVariables: React.FC<ContextVariablesProps & WithTranslation> = ({ contextVars, t }) => (
  <div className="container mt-5 w-100">
    <div>
      <h3>{t('Context Variables')}</h3>
      <p>
        {t('context_variables_des1')}
        <var>context_vars</var>
        {t('context_variables_des2')}
        {'dtale.show(), ex:'}
        <span className="font-weight-bold"> dtale.show(df, context_vars={"{'foo': [1, 2, 3]}"})</span>
        <br />
        {t('context_variables_des3')}
        {'ex:'}
        <span className="font-weight-bold"> Col in @foo </span>
        {t('context_variables_des4')}
      </p>
    </div>
    {contextVars.length === 0 && <p>{t('No context variables are defined.')}</p>}
    {contextVars.length > 0 && (
      <div>
        <AutoSizer disableHeight={true}>
          {({ width }) => (
            <Table
              className="contextVariables"
              width={width}
              height={Math.min(300, (contextVars.length + 1) * (gu.ROW_HEIGHT + 2))}
              headerHeight={gu.ROW_HEIGHT}
              headerClassName="headerCell"
              rowHeight={gu.ROW_HEIGHT}
              rowCount={contextVars.length}
              rowGetter={({ index }) => contextVars[index]}
              rowStyle={{ display: 'flex' }}
            >
              <Column label="Name" dataKey="name" width={200} className="cell" />
              <Column label="Value" dataKey="value" width={300} flexGrow={1} className="cell" />
            </Table>
          )}
        </AutoSizer>
      </div>
    )}
  </div>
);

export default withTranslation('filter')(ContextVariables);
