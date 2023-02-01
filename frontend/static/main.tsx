import * as React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { DataViewer } from './dtale/DataViewer';
import './i18n';
import ColumnAnalysis from './popups/analysis/ColumnAnalysis';
import { CodeExport } from './popups/CodeExport';
import CodePopup from './popups/CodePopup';
import { Correlations } from './popups/correlations/Correlations';
import CreateColumn from './popups/create/CreateColumn';
import { CreateColumnType, PrepopulateCreateColumn, SaveAs } from './popups/create/CreateColumnState';
import Describe from './popups/describe/Describe';
import Duplicates from './popups/duplicates/Duplicates';
import FilterPopup from './popups/filter/FilterPopup';
import Instances from './popups/instances/Instances';
import MergeDatasets from './popups/merge/MergeDatasets';
import PredictivePowerScore from './popups/pps/PredictivePowerScore';
import CreateReplacement from './popups/replacement/CreateReplacement';
import Reshape from './popups/reshape/Reshape';
import Upload from './popups/upload/Upload';
import Variance from './popups/variance/Variance';
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
  pathname = pathname.replace((window as any).resourceBaseUrl, '');
}
let storeBuilder: () => Store = () => {
  const store = createAppStore<AppState>(appReducers);
  store.dispatch(actions.init());
  actions.loadBackgroundMode(store);
  actions.loadHideShutdown(store);
  actions.loadAllowCellEdits(store);
  actions.loadHideHeaderEditor(store);
  return store;
};
if (pathname.indexOf('/dtale/popup') === 0) {
  require('./dtale/DataViewer.css');

  let rootNode = null;
  const settings = toJson<InstanceSettings>(getHiddenValue('settings'));
  const dataId = getHiddenValue('data_id');
  const pathSegs = pathname.split('/');
  const popupType = pathSegs[pathSegs.length - 1] === 'code-popup' ? 'code-popup' : pathSegs[3];
  const chartData: Record<string, any> = {
    ...actions.getParams(),
    ...(settings.query ? { query: settings.query } : {}),
  };
  switch (popupType) {
    case 'filter':
      rootNode = <FilterPopup />;
      break;
    case 'correlations':
      rootNode = <Correlations />;
      break;
    case 'merge':
      storeBuilder = () => {
        const store = createAppStore<MergeState>(mergeReducers);
        mergeActions.init(store.dispatch);
        return store;
      };
      rootNode = <MergeDatasets />;
      break;
    case 'pps':
      rootNode = <PredictivePowerScore />;
      break;
    case 'describe':
      rootNode = <Describe />;
      break;
    case 'variance':
      rootNode = <Variance />;
      break;
    case 'build':
      rootNode = <CreateColumn />;
      break;
    case 'duplicates':
      rootNode = <Duplicates />;
      break;
    case 'type-conversion': {
      const prePopulated: PrepopulateCreateColumn = {
        type: CreateColumnType.TYPE_CONVERSION,
        saveAs: SaveAs.INPLACE,
        cfg: { col: chartData.selectedCol, applyAllType: false },
      };
      rootNode = <CreateColumn prePopulated={prePopulated} />;
      break;
    }
    case 'cleaners': {
      const prePopulated: PrepopulateCreateColumn = {
        type: CreateColumnType.CLEANING,
        cfg: { col: chartData.selectedCol, cleaners: [] },
      };
      rootNode = <CreateColumn prePopulated={prePopulated} />;
      break;
    }
    case 'replacement':
      rootNode = <CreateReplacement />;
      break;
    case 'reshape':
      rootNode = <Reshape />;
      break;
    case 'column-analysis':
      rootNode = <ColumnAnalysis {...{ dataId, chartData }} height={250} />;
      break;
    case 'instances':
      rootNode = <Instances />;
      break;
    case 'code-export':
      rootNode = <CodeExport />;
      break;
    case 'upload':
    default:
      rootNode = <Upload />;
      break;
  }
  const store = storeBuilder();
  store.getState().chartData = chartData;
  const root = ReactDOMClient.createRoot(document.getElementById('popup-content')!);
  root.render(<Provider store={store}>{rootNode}</Provider>);
} else if (pathname.startsWith('/dtale/code-popup')) {
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
  const root = ReactDOMClient.createRoot(document.getElementById('popup-content')!);
  root.render(body);
} else {
  const store = storeBuilder();
  if (store.getState().openPredefinedFiltersOnStartup) {
    store.dispatch(actions.openPredefinedFilters());
  } else if (store.getState().openCustomFilterOnStartup) {
    store.dispatch(actions.openCustomFilter());
  }
  const root = ReactDOMClient.createRoot(document.getElementById('content')!);
  root.render(
    <Provider store={store}>
      <DataViewer />
    </Provider>,
  );
}
