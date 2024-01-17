import { PayloadAction } from '@reduxjs/toolkit';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { closeChart } from '../redux/actions/charts';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { selectChartData } from '../redux/selectors';
import { ConfirmationPopupData } from '../redux/state/AppState';

require('./Confirmation.css');

const Confirmation: React.FC<WithTranslation> = ({ t }) => {
  const chartData = useAppSelector(selectChartData);
  const dispatch = useAppDispatch();

  const { msg, yesAction } = chartData as ConfirmationPopupData;
  const onClose = (): PayloadAction<void> => dispatch(closeChart());
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
