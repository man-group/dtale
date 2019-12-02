import _ from "lodash";
import React from "react";
import ReactDOM from "react-dom";

import actions from "../../actions/dtale";
import "../../adapter-for-react-16";
import { ReactCorrelations as Correlations } from "../Correlations";

const settingsElem = document.getElementById("settings");
const settings = settingsElem ? JSON.parse(settingsElem.value) : {};
const chartData = _.assignIn(actions.getParams(), { visible: true }, settings.query ? { query: settings.query } : {});

ReactDOM.render(<Correlations chartData={chartData} />, document.getElementById("popup-content"));
