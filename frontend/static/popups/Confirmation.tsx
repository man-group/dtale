import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { CloseChartAction } from '../redux/actions/AppActions';
import { closeChart } from '../redux/actions/charts';
import { AppState, ConfirmationPopupData } from '../redux/state/AppState';

require('./Confirmation.css');

const Confirmation: React.FC<WithTranslation> = ({ t }) => {
  const chartData = useSelector((state: AppState) => state.chartData);
  const dispatch = useDispatch();

  const { msg, yesAction } = chartData as ConfirmationPopupData;
  const onClose = (): CloseChartAction => dispatch(closeChart(chartData));
  const fullYesAction = (): void => {
    yesAction?.();
    onClose();
  };
  return (
    <React.Fragment>
      <div className="modal-body">
        <div className="row">
          <div className="col-md-12 text-center">{msg}</div>
        </div>
      </div>
      <div className="modal-footer confirmation">
        <button className="btn btn-primary" onClick={fullYesAction}>
          <span>{t('Yes')}</span>
        </button>
        <button className="btn btn-secondary" onClick={onClose}>
          <span>{t('No')}</span>
        </button>
      </div>
    </React.Fragment>
  );
};

export default withTranslation('popup')(Confirmation);
