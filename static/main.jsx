import _ from "lodash";
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import actions from "./actions/dtale";
import "./adapter-for-react-16";
import { DataViewer } from "./dtale/DataViewer";
import { CodeExport } from "./popups/CodeExport";
import { CodePopup } from "./popups/CodePopup";
import { ReactCorrelations as Correlations } from "./popups/Correlations";
import { ReactDescribe as Describe } from "./popups/Describe";
import { ReactHistogram as Histogram } from "./popups/Histogram";
import Instances from "./popups/Instances";
import { ReactCharts as Charts } from "./popups/charts/Charts";
import { ReactCreateColumn as CreateColumn } from "./popups/create/CreateColumn";
import app from "./reducers/dtale";
import { createStore } from "./reducers/store";

const settingsElem = document.getElementById("settings");
const settings = settingsElem ? JSON.parse(settingsElem.value) : {};

if (_.startsWith(window.location.pathname, "/dtale/popup")) {
  require("./dtale/DataViewer.css");

  let rootNode = null;
  const dataId = app.getHiddenValue("data_id");
  const chartData = _.assignIn(actions.getParams(), { visible: true }, settings.query ? { query: settings.query } : {});
  const pathSegs = _.split(window.location.pathname, "/");
  const popupType = pathSegs[pathSegs.length - 1] === "code-popup" ? "code-popup" : pathSegs[3];

  switch (popupType) {
    case "correlations":
      rootNode = <Correlations {...{ dataId, chartData }} />;
      break;
    case "describe":
      rootNode = <Describe {...{ dataId, chartData }} />;
      break;
    case "build":
      rootNode = <CreateColumn {...{ dataId, chartData }} />;
      break;
    case "histogram":
      rootNode = <Histogram {...{ dataId, chartData }} height={250} />;
      break;
    case "instances":
      rootNode = <Instances dataId={dataId} iframe={true} />;
      break;
    case "code":
      rootNode = <CodeExport dataId={dataId} />;
      break;
    case "charts":
    default:
      rootNode = <Charts {...{ dataId, chartData }} />;
      break;
  }
  ReactDOM.render(rootNode, document.getElementById("popup-content"));
} else if (_.startsWith(window.location.pathname, "/dtale/code-popup")) {
  require("./dtale/DataViewer.css");
  document.getElementById("code-title").innerHTML = `${window.opener.code_popup.title} Code Snippet`;
  ReactDOM.render(<CodePopup code={window.opener.code_popup.code} />, document.getElementById("popup-content"));
} else {
  const store = createStore(app.store);
  store.dispatch(actions.init());

  ReactDOM.render(
    <Provider store={store}>
      <DataViewer settings={settings} />
    </Provider>,
    document.getElementById("content")
  );
}
