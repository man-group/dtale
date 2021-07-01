import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import * as actions from "../actions/dtale";
import "../adapter-for-react-16";
import "../i18n";
import app from "../reducers/dtale";
import { createStore } from "../reducers/store";
import { NetworkDisplay } from "./NetworkDisplay";

require("../publicPath");

const store = createStore(app.store);
store.dispatch(actions.init());
ReactDOM.render(
  <Provider store={store}>
    <NetworkDisplay {...actions.getParams()} />
  </Provider>,
  document.getElementById("content")
);
