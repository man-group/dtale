import * as React from 'react';
import { useSelector } from 'react-redux';

import { AppState, ErrorPopupData } from '../redux/state/AppState';
import { RemovableError } from '../RemovableError';

export const Error: React.FC = () => {
  const chartData = useSelector((state: AppState) => state.chartData) as ErrorPopupData;

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
