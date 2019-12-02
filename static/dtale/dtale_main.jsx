import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import actions from "../actions/dtale";
import "../adapter-for-react-16";
import app from "../reducers/dtale";
import { createStore } from "../reducers/store";
import { DataViewer } from "./DataViewer";

const store = createStore(app);
store.dispatch(actions.init());

const settingsElem = document.getElementById("settings");
const settings = settingsElem ? JSON.parse(settingsElem.value) : {};

const rootNode = (
  <Provider store={store}>
    <DataViewer settings={settings} />
  </Provider>
);

ReactDOM.render(rootNode, document.getElementById("content"));
