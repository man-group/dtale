import { createReducer } from '@reduxjs/toolkit';

import { AppActions } from '../../actions/AppActions';
import { initialPopup, Popups } from '../../state/AppState';

export const chartData = createReducer<Popups>(initialPopup as Popups, (builder) =>
  builder
    .addCase(AppActions.OpenChartAction, (state, action) => ({ ...action.payload, visible: true }))
    .addCase(AppActions.UpdateXarrayDimAction, (state) => ({ ...state, visible: false }))
    .addCase(AppActions.ConvertToXarrayAction, (state) => ({ ...state, visible: false }))
    .addCase(AppActions.CloseChartAction, (state) => ({ ...state, visible: false }))
    .addCase(AppActions.LoadingDatasetsAction, (state) => ({ ...state, visible: false })),
);
