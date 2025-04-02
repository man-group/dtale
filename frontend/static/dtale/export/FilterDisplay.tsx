import { createSelector } from '@reduxjs/toolkit';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { useAppSelector } from '../../redux/hooks';
import * as selectors from '../../redux/selectors';
import { truncate } from '../../stringUtils';
import { ColumnFilter, OutlierFilter } from '../DataViewerState';
import * as gu from '../gridUtils';
import { buildMenuHandler, InfoMenuType, predefinedFilterStr } from '../info/infoUtils';

const removeBackticks = (query: string): string => query.replace(/`/g, '');

export const Queries: React.FC<{ prop: string; filters: Record<string, OutlierFilter | ColumnFilter> }> = ({
  filters,
  prop,
}) => (
  <React.Fragment>
    {Object.entries(filters).map(([col, cfg]) => {
      return (
        <li key={`${prop}-${col}`}>
          <span className="toggler-action" />
          <span className="font-weight-bold text-nowrap">{removeBackticks(cfg.query ?? '')}</span>
        </li>
      );
    })}
  </React.Fragment>
);

/** Component properties for FilterDisplay */
export interface FilterDisplayProps {
  menuOpen?: InfoMenuType;
  setMenuOpen: (menuOpen?: InfoMenuType) => void;
}

const selectResult = createSelector(
  [
    selectors.selectPredefinedFilterConfigs,
    selectors.selectInvertFilter,
    selectors.selectQuery,
    selectors.selectColumnFilters,
    selectors.selectPredefinedFilters,
    selectors.selectOutlierFilters,
    selectors.selectSortInfo,
  ],
  (predefinedFilterConfigs, invertFilter, query, columnFilters, predefinedFilters, outlierFilters, sortInfo) => ({
    predefinedFilterConfigs,
    invertFilter: invertFilter ?? false,
    query,
    columnFilters: columnFilters ?? {},
    predefinedFilters: predefinedFilters ?? {},
    outlierFilters: outlierFilters ?? {},
    sortInfo,
  }),
);

const FilterDisplay: React.FC<FilterDisplayProps & WithTranslation> = ({ menuOpen, setMenuOpen, t }) => {
  const reduxState = useAppSelector(selectResult);
  const filterRef = React.useRef<HTMLDivElement>(null);

  const displayPredefined = (): JSX.Element => (
    <React.Fragment>
      {Object.entries(gu.filterPredefined(reduxState.predefinedFilters)).map(([name, value]) => {
        const displayValue = predefinedFilterStr(reduxState.predefinedFilterConfigs, name, value.value);
        return (
          <li key={`predefined-${name}`}>
            <span className="font-weight-bold text-nowrap">{`${name}: ${displayValue}`}</span>
          </li>
        );
      })}
    </React.Fragment>
  );

  const { query, columnFilters, outlierFilters, predefinedFilterConfigs } = reduxState;
  if (gu.noFilters(reduxState)) {
    return null;
  }
  const label = <div className="font-weight-bold d-inline-block">{`${t('Filter')}:`}</div>;
  const filterSegs = [
    ...Object.values(columnFilters).map((filter) => filter.query),
    ...Object.values(outlierFilters).map((filter) => filter.query),
    ...Object.entries(gu.filterPredefined(reduxState.predefinedFilters)).map(
      ([name, value]) => `${name}: ${predefinedFilterStr(predefinedFilterConfigs, name, value.value)}`,
    ),
  ];
  if (query) {
    filterSegs.push(query);
  }

  if (filterSegs.length === 1) {
    return (
      <>
        {label}
        <div className="pl-3 d-inline-block filter-menu-toggle">{removeBackticks(filterSegs[0] ?? '')}</div>
      </>
    );
  }

  const clickHandler = buildMenuHandler(InfoMenuType.FILTER, setMenuOpen, filterRef);
  const filterText = truncate(removeBackticks(filterSegs.join(' and ')), 30);
  return (
    <>
      {label}
      <div className="pl-3 d-inline-block filter-menu-toggle" onClick={clickHandler} ref={filterRef}>
        <span className="pointer">{filterText}</span>
        <div className="column-toggle__dropdown" hidden={menuOpen !== InfoMenuType.FILTER}>
          <ul>
            <Queries prop="columnFilters" filters={reduxState.columnFilters} />
            <Queries prop="outlierFilters" filters={reduxState.outlierFilters} />
            {displayPredefined()}
            {query && (
              <li>
                <span className="font-weight-bold text-nowrap">{query}</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </>
  );
};

export default withTranslation('main')(FilterDisplay);
