import { PayloadAction } from '@reduxjs/toolkit';

import { Popups } from '../state/AppState';

import { AppActions } from './AppActions';

export const openChart = (chartData: Popups): PayloadAction<Popups> => AppActions.OpenChartAction(chartData);

export const closeChart = (): PayloadAction<void> => AppActions.CloseChartAction();
