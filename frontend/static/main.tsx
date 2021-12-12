import _ from 'lodash';
import * as React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { DataViewer } from './dtale/DataViewer';
import './i18n';
import { ReactColumnAnalysis as ColumnAnalysis } from './popups/analysis/ColumnAnalysis';
import { CodeExport } from './popups/CodeExport';
import { CodePopup } from './popups/CodePopup';
import Correlations from './popups/Correlations';
import { ReactCreateColumn as CreateColumn } from './popups/create/CreateColumn';
import { Describe } from './popups/describe/Describe';
import { ReactDuplicates as Duplicates } from './popups/duplicates/Duplicates';
import { ReactFilterPopup as FilterPopup } from './popups/filter/FilterPopup';
import Instances from './popups/instances/Instances';
import ReduxMergeDatasets from './popups/merge/MergeDatasets';
import PredictivePowerScore from './popups/pps/PredictivePowerScore';
import { ReactCreateReplacement as CreateReplacement } from './popups/replacement/CreateReplacement';
import { ReactReshape as Reshape } from './popups/reshape/Reshape';
import { ReactUpload as Upload } from './popups/upload/Upload';
import { Variance } from './popups/variance/Variance';
import * as actions from './redux/actions/dtale';
import * as mergeActions from './redux/actions/merge';
import appReducers from './redux/reducers/app';
import mergeReducers from './redux/reducers/merge';
import { getHiddenValue, toJson } from './redux/reducers/utils';
import { AppState, InstanceSettings } from './redux/state/AppState';
import { MergeState } from './redux/state/MergeState';
import { createAppStore } from './redux/store';

require('./publicPath');

let pathname = window.location.pathname;
if ((window as any).resourceBaseUrl) {
  pathname = _.replace(pathname, (window as any).resourceBaseUrl, '');
}
let storeBuilder: () => Store = () => {
  const store = createAppStore<AppState>(appReducers);
  store.dispatch(actions.init());
  return store;
};
if (pathname.indexOf('/dtale/popup') === 0) {
  require('./dtale/DataViewer.css');

  let rootNode = null;
  const settings = toJson<InstanceSettings>(getHiddenValue('settings'));
  const dataId = getHiddenValue('data_id');
  const chartData: Record<string, any> = {
    ...actions.getParams(),
    visible: true,
    ...(settings.query ? { query: settings.query } : {}),
  };
  const pathSegs = pathname.split('/');
  const popupType = pathSegs[pathSegs.length - 1] === 'code-popup' ? 'code-popup' : pathSegs[3];
  switch (popupType) {
    case 'filter':
      rootNode = <FilterPopup {...{ dataId, chartData }} />;
      break;
    case 'correlations':
      rootNode = <Correlations {...{ dataId, chartData }} />;
      break;
    case 'merge':
      storeBuilder = () => {
        const store = createAppStore<MergeState>(mergeReducers);
        mergeActions.init(store.dispatch);
        return store;
      };
      rootNode = <ReduxMergeDatasets />;
      break;
    case 'pps':
      rootNode = <PredictivePowerScore {...{ dataId, chartData }} />;
      break;
    case 'describe':
      rootNode = <Describe {...{ dataId, chartData }} />;
      break;
    case 'variance':
      rootNode = <Variance {...{ dataId, chartData }} />;
      break;
    case 'build':
      rootNode = <CreateColumn {...{ dataId, chartData }} />;
      break;
    case 'duplicates':
      rootNode = <Duplicates {...{ dataId, chartData }} />;
      break;
    case 'type-conversion': {
      const prePopulated = {
        type: 'type_conversion',
        saveAs: 'inplace',
        cfg: { col: chartData.selectedCol },
      };
      rootNode = <CreateColumn {...{ dataId, chartData, prePopulated }} />;
      break;
    }
    case 'cleaners': {
      const prePopulated = {
        type: 'cleaning',
        cfg: { col: chartData.selectedCol },
      };
      rootNode = <CreateColumn {...{ dataId, chartData, prePopulated }} />;
      break;
    }
    case 'replacement':
      rootNode = <CreateReplacement {...{ dataId, chartData }} />;
      break;
    case 'reshape':
      rootNode = <Reshape {...{ dataId, chartData }} />;
      break;
    case 'column-analysis':
      rootNode = <ColumnAnalysis {...{ dataId, chartData }} height={250} />;
      break;
    case 'instances':
      rootNode = <Instances dataId={dataId} iframe={true} />;
      break;
    case 'code-export':
      rootNode = <CodeExport dataId={dataId} />;
      break;
    case 'upload':
    default:
      rootNode = <Upload chartData={{ visible: true }} />;
      break;
  }
  ReactDOM.render(<Provider store={storeBuilder()}>{rootNode}</Provider>, document.getElementById('popup-content'));
} else if (_.startsWith(pathname, '/dtale/code-popup')) {
  require('./dtale/DataViewer.css');
  let title: string;
  let body: JSX.Element;
  if (window.opener) {
    title = `${window.opener.code_popup.title} Code Export`;
    body = <CodePopup code={window.opener.code_popup.code} />;
  } else {
    title = 'Code Missing';
    body = <h1>No parent window containing code detected!</h1>;
  }
  const titleElement: HTMLElement | null = document.getElementById('code-title');
  if (titleElement) {
    titleElement.innerHTML = title;
  }
  ReactDOM.render(body, document.getElementById('popup-content'));
} else {
  const store = storeBuilder();
  store.dispatch(actions.init());
  if (store.getState().openPredefinedFiltersOnStartup) {
    store.dispatch(actions.openPredefinedFilters());
  } else if (store.getState().openCustomFilterOnStartup) {
    store.dispatch(actions.openCustomFilter());
  }
  ReactDOM.render(
    <Provider store={store}>
      <DataViewer />
    </Provider>,
    document.getElementById('content'),
  );
}
