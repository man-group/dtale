import * as React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import { Provider } from 'react-redux';

import '../i18n';
import * as actions from '../redux/actions/dtale';
import app from '../redux/reducers/app';
import { createAppStore } from '../redux/store';

import { NetworkDisplay } from './NetworkDisplay';

require('../publicPath');

const store = createAppStore(app);
store.dispatch(actions.init());
const root = ReactDOMClient.createRoot(document.getElementById('content')!);
root.render(
  <Provider store={store}>
    <NetworkDisplay {...actions.getParams()} />
  </Provider>,
);
