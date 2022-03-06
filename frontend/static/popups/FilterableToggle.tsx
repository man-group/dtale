import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

/** Component properties for FilterableToggle */
interface FilterableToggleProps {
  hasFilters: boolean;
  filtered: boolean;
  propagateState: (state: { filtered: boolean }) => void;
  className?: string;
}

const FilterableToggle: React.FC<FilterableToggleProps & WithTranslation> = ({
  hasFilters,
  filtered,
  propagateState,
  className,
  t,
}) => (
  <React.Fragment>
    {hasFilters && (
      <div className={`col-auto mt-auto mb-auto hoverable filtered ${className ?? ''}`}>
        <span className="font-weight-bold pr-3">{t('Filtered')}:</span>
        <i
          className={`ico-check-box${filtered ? '' : '-outline-blank'} pointer`}
          onClick={() => propagateState({ filtered: !filtered })}
        />
        <div className="hoverable__content">{t('description')}</div>
      </div>
    )}
  </React.Fragment>
);

export default withTranslation(['filterable'])(FilterableToggle);
