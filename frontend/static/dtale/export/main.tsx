import * as React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import { Provider } from 'react-redux';

import '../../i18n';
import { appStore } from '../../redux/store';
import { DataResponseContent } from '../../repository/DataRepository';

import { ServerlessDataViewer } from './ServerlessDataViewer';

require('../../publicPath');

const root = ReactDOMClient.createRoot(document.getElementById('content')!);
root.render(
  (
    <Provider store={appStore}>
      <ServerlessDataViewer response={(global as any).RESPONSE! as DataResponseContent} />
    </Provider>
  ) as any,
);
