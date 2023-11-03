import * as React from 'react';
import { useSelector } from 'react-redux';

import { selectChartData } from '../redux/selectors';
import { ErrorPopupData } from '../redux/state/AppState';
import { RemovableError } from '../RemovableError';

export const Error: React.FC = () => {
  const chartData = useSelector(selectChartData) as ErrorPopupData;
  return (
    <div key="body" className="modal-body">
      <div className="row">
        <div className="col-md-12">
          <RemovableError {...chartData} />
        </div>
      </div>
    </div>
  );
};
