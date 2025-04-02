import React from 'react';
import { Provider } from 'react-redux';

import { DataViewer } from '../dtale/DataViewer';
import * as actions from '../redux/actions/dtale';
import { buildApp } from '../redux/store';

export const Base: React.FC = () => {
  const store = React.useMemo(() => {
    const value = buildApp();
    const { openPredefinedFiltersOnStartup, openCustomFilterOnStartup } = value.getState();
    if (openPredefinedFiltersOnStartup) {
      value.dispatch(actions.openPredefinedFilters());
    } else if (openCustomFilterOnStartup) {
      value.dispatch(actions.openCustomFilter());
    }
    return value;
  }, []);

  return (
    <Provider store={store}>
      <DataViewer />
    </Provider>
  );
};
