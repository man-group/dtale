import * as React from 'react';
import { TFunction } from 'react-i18next';

import { kurtMsg, skewMsg } from '../../dtale/column/ColumnMenuHeader';

export const COUNT_STATS = ['count', 'missing_ct', 'missing_pct'];
export const POSITION_STATS = ['first', 'last', 'top'];
export const LABELS: Record<string, string> = Object.freeze({
  total_count: 'Total Rows',
  count: 'Count (non-nan)',
  missing_ct: 'Count (missing)',
  missing_pct: '% Missing',
  freq: 'Frequency',
  kurt: 'Kurtosis',
  skew: 'Skew',
  top: 'Most Frequent',
  unique: 'Unique',
});

/** Component properties for Stat */
interface StatProps {
  field: string;
  value: any;
  t: TFunction;
}

export const Stat: React.FC<StatProps> = ({ t, field, value, children }) => (
  <li>
    {value !== undefined && (
      <div>
        <h4 className="d-inline pr-5">{`${t(LABELS[field] ?? field)}:`}</h4>
        <span className="d-inline">
          {value}
          {field === 'skew' && skewMsg(value)}
          {field === 'kurt' && kurtMsg(value)}
        </span>
      </div>
    )}
    {children}
  </li>
);
