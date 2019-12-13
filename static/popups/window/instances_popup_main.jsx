import React from "react";
import ReactDOM from "react-dom";

import "../../adapter-for-react-16";
import app from "../../reducers/dtale";
import Instances from "../Instances";

const dataId = app.getHiddenValue("data_id");

ReactDOM.render(<Instances dataId={dataId} iframe={true} />, document.getElementById("popup-content"));
