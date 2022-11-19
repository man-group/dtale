import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { ColumnFilter, OutlierFilter } from '../../dtale/DataViewerState';

/** Component properties for StructuredFilters */
export interface StructuredFiltersProps {
  label: string;
  dropFilter: (col: string) => void;
  filters: Record<string, ColumnFilter | OutlierFilter>;
}

const StructuredFilters: React.FC<StructuredFiltersProps & WithTranslation> = ({ dropFilter, filters, label, t }) => (
  <React.Fragment>
    {!!Object.keys(filters ?? {}).length && (
      <div data-testid="structured-filters">
        <div className="font-weight-bold">{`${t('Active')} ${label}:`}</div>
        {Object.keys(filters)
          .filter((k) => filters[k].query !== undefined)
          .map((k) => (
            <div key={k}>
              <i className="ico-cancel pointer mr-4" onClick={() => dropFilter(k)} />
              <span className="align-middle">{`${filters[k].query} and`}</span>
            </div>
          ))}
      </div>
    )}
  </React.Fragment>
);

export default withTranslation('filter')(StructuredFilters);
