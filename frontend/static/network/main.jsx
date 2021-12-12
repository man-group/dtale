import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import * as actions from '../redux/actions/dtale';
import '../i18n';
import app from '../redux/reducers/app';
import { createAppStore } from '../redux/store';
import { NetworkDisplay } from './NetworkDisplay';

require('../publicPath');

const store = createAppStore(app);
store.dispatch(actions.init());
ReactDOM.render(
  <Provider store={store}>
    <NetworkDisplay {...actions.getParams()} />
  </Provider>,
  document.getElementById('content'),
);
