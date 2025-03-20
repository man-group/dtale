import { createSelector } from '@reduxjs/toolkit';
import React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import * as gu from '../dtale/gridUtils';
import { useAppSelector } from '../redux/hooks';
import { selectChartData } from '../redux/selectors';
import { ViewRowPopupData } from '../redux/state/AppState';

require('./ViewRow.css');

const selectResult = createSelector([selectChartData], (chartData) => ({
  chartData: chartData as ViewRowPopupData,
}));

export const ViewRow: React.FC<WithTranslation> = ({ t }) => {
  const { chartData } = useAppSelector(selectResult);
  const { columns, row } = chartData;

  const displayCols = React.useMemo(() => {
    return columns.filter((colCfg) => !gu.isIndex(colCfg.name));
  }, [columns]);

  return (
    <div className="modal-body" data-testid="view-row-body">
      <div className="form-group row pl-5 pr-5">
        {displayCols.map((colCfg, idx) => (
          <React.Fragment key={idx}>
            <div className="col-md-6 view-row-cell">
              <b>{`${colCfg.name}:`}</b>
              <div className="float-right" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {row[colCfg.name].view}
              </div>
            </div>
          </React.Fragment>
        ))}
        {displayCols.length % 2 === 1 && <div className="col-md-6 view-row-cell" />}
      </div>
    </div>
  );
};

export default withTranslation('view-row')(ViewRow);
