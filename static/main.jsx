import _ from "lodash";
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import * as actions from "./actions/dtale";
import mergeActions from "./actions/merge";
import "./adapter-for-react-16";
import { DataViewer } from "./dtale/DataViewer";
import "./i18n";
import { CodeExport } from "./popups/CodeExport";
import { CodePopup } from "./popups/CodePopup";
import Correlations from "./popups/Correlations";
import { ReactColumnAnalysis as ColumnAnalysis } from "./popups/analysis/ColumnAnalysis";
import { ReactCreateColumn as CreateColumn } from "./popups/create/CreateColumn";
import { Describe } from "./popups/describe/Describe";
import { ReactDuplicates as Duplicates } from "./popups/duplicates/Duplicates";
import { ReactFilterPopup as FilterPopup } from "./popups/filter/FilterPopup";
import Instances from "./popups/instances/Instances";
import MergeDatasets from "./popups/merge/MergeDatasets";
import PredictivePowerScore from "./popups/pps/PredictivePowerScore";
import { ReactCreateReplacement as CreateReplacement } from "./popups/replacement/CreateReplacement";
import { ReactReshape as Reshape } from "./popups/reshape/Reshape";
import { ReactUpload as Upload } from "./popups/upload/Upload";
import { Variance } from "./popups/variance/Variance";
import app from "./reducers/dtale";
import mergeApp from "./reducers/merge";
import { createStore } from "./reducers/store";
import { getHiddenValue, toJson } from "./reducers/utils";

require("./publicPath");

let pathname = window.location.pathname;
if (window.resourceBaseUrl) {
  pathname = _.replace(pathname, window.resourceBaseUrl, "");
}
if (_.startsWith(pathname, "/dtale/popup")) {
  require("./dtale/DataViewer.css");

  let rootNode = null;
  const settings = toJson(getHiddenValue("settings"));
  const dataId = getHiddenValue("data_id");
  const chartData = _.assignIn(actions.getParams(), { visible: true }, settings.query ? { query: settings.query } : {});
  const pathSegs = pathname.split("/");
  const popupType = pathSegs[pathSegs.length - 1] === "code-popup" ? "code-popup" : pathSegs[3];
  let store = createStore(app.store);
  let appActions = actions;
  switch (popupType) {
    case "filter":
      rootNode = <FilterPopup {...{ dataId, chartData }} />;
      break;
    case "correlations":
      rootNode = <Correlations {...{ dataId, chartData }} />;
      break;
    case "merge":
      store = createStore(mergeApp);
      appActions = mergeActions;
      rootNode = <MergeDatasets />;
      break;
    case "pps":
      rootNode = <PredictivePowerScore {...{ dataId, chartData }} />;
      break;
    case "describe":
      rootNode = <Describe {...{ dataId, chartData }} />;
      break;
    case "variance":
      rootNode = <Variance {...{ dataId, chartData }} />;
      break;
    case "build":
      rootNode = <CreateColumn {...{ dataId, chartData }} />;
      break;
    case "duplicates":
      rootNode = <Duplicates {...{ dataId, chartData }} />;
      break;
    case "type-conversion": {
      const prePopulated = {
        type: "type_conversion",
        saveAs: "inplace",
        cfg: { col: chartData.selectedCol },
      };
      rootNode = <CreateColumn {...{ dataId, chartData, prePopulated }} />;
      break;
    }
    case "cleaners": {
      const prePopulated = {
        type: "cleaning",
        cfg: { col: chartData.selectedCol },
      };
      rootNode = <CreateColumn {...{ dataId, chartData, prePopulated }} />;
      break;
    }
    case "replacement":
      rootNode = <CreateReplacement {...{ dataId, chartData }} />;
      break;
    case "reshape":
      rootNode = <Reshape {...{ dataId, chartData }} />;
      break;
    case "column-analysis":
      rootNode = <ColumnAnalysis {...{ dataId, chartData }} height={250} />;
      break;
    case "instances":
      rootNode = <Instances dataId={dataId} iframe={true} />;
      break;
    case "code-export":
      rootNode = <CodeExport dataId={dataId} />;
      break;
    case "upload":
    default:
      rootNode = <Upload chartData={{ visible: true }} />;
      break;
  }
  store.dispatch(appActions.init());
  ReactDOM.render(<Provider store={store}>{rootNode}</Provider>, document.getElementById("popup-content"));
} else if (_.startsWith(pathname, "/dtale/code-popup")) {
  require("./dtale/DataViewer.css");
  let title, body;
  if (window.opener) {
    title = `${window.opener.code_popup.title} Code Export`;
    body = <CodePopup code={window.opener.code_popup.code} />;
  } else {
    title = "Code Missing";
    body = <h1>No parent window containing code detected!</h1>;
  }
  document.getElementById("code-title").innerHTML = title;
  ReactDOM.render(body, document.getElementById("popup-content"));
} else {
  const store = createStore(app.store);
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
    document.getElementById("content")
  );
}
