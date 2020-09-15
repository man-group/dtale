import _ from "lodash";
import React from "react";

import About from "./About";
import { CodeExport } from "./CodeExport";
import { Confirmation } from "./Confirmation";
import { Correlations } from "./Correlations";
import { Error } from "./ErrorPopup";
import { Filter } from "./Filter";
import Instances from "./Instances";
import { RangeHighlight } from "./RangeHighlight";
import { Rename } from "./Rename";
import { Upload } from "./Upload";
import { XArrayDimensions } from "./XArrayDimensions";
import { XArrayIndexes } from "./XArrayIndexes";
import { ColumnAnalysis } from "./analysis/ColumnAnalysis";
import { CreateColumn } from "./create/CreateColumn";
import { Duplicates } from "./duplicates/Duplicates";
import { CreateReplacement } from "./replacement/CreateReplacement";
import { Reshape } from "./reshape/Reshape";
import { Variance } from "./variance/Variance";

function buildFilter() {
  const title = (
    <React.Fragment>
      <i className="fa fa-filter" />
      <strong>Custom Filter</strong>
    </React.Fragment>
  );
  const body = <Filter />;
  return { title, body };
}

function buildColumnAnalysis(props) {
  const title = (
    <React.Fragment>
      <i className="ico-equalizer" />
      {" Column Analysis for "}
      <strong>{_.get(props, "chartData.selectedCol")}</strong>
      <div id="describe" />
    </React.Fragment>
  );
  const body = <ColumnAnalysis />;
  return { title, body };
}

function buildCorrelations(props) {
  const title = (
    <React.Fragment>
      <i className="ico-bubble-chart" />
      <strong>{_.get(props, "chartData.title")}</strong>
    </React.Fragment>
  );
  const body = <Correlations propagateState={props.propagateState} />;
  return { title, body };
}

function buildCreateColumn() {
  const title = (
    <React.Fragment>
      <i className="ico-build" />
      <strong>{"Build Column"}</strong>
    </React.Fragment>
  );
  const body = <CreateColumn />;
  return { title, body };
}

function buildTypeConversion(props) {
  const title = (
    <React.Fragment>
      <i className="ico-build" />
      {" Type Conversion of "}
      <strong>{_.get(props, "chartData.selectedCol")}</strong>
    </React.Fragment>
  );
  const body = (
    <CreateColumn
      prePopulated={{
        type: "type_conversion",
        saveAs: "inplace",
        cfg: { col: _.get(props, "chartData.selectedCol") },
      }}
    />
  );
  return { title, body };
}

function buildReshape() {
  const title = (
    <React.Fragment>
      <i className="fas fa-tools" />
      <strong>{"Summarize Data"}</strong>
    </React.Fragment>
  );
  const body = <Reshape />;
  return { title, body };
}

function buildAbout() {
  const title = (
    <React.Fragment>
      <i className="fa fa-info-circle la-lg" />
      <strong>{"About"}</strong>
    </React.Fragment>
  );
  const body = <About />;
  return { title, body };
}

function buildConfirm(props) {
  const title = (
    <React.Fragment>
      <i className="ico-check-circle" />
      <strong>Yes/No</strong>
      <small className="pl-3">({_.get(props, "chartData.title")})</small>
    </React.Fragment>
  );
  const body = <Confirmation />;
  return { title, body };
}

function buildRange(props) {
  const title = (
    <React.Fragment>
      <i className="ico-flag" />
      <strong>Range Highlights</strong>
    </React.Fragment>
  );
  const body = <RangeHighlight {...props} />;
  return { title, body };
}

function xarrayDimensions(props) {
  const title = (
    <React.Fragment>
      <i className="ico-key" />
      <strong>XArray Dimensions</strong>
    </React.Fragment>
  );
  const body = <XArrayDimensions {...props} />;
  return { title, body };
}

function xarrayIndexes(props) {
  const title = (
    <React.Fragment>
      <i className="ico-tune" />
      <strong>Convert to XArray</strong>
    </React.Fragment>
  );
  const body = <XArrayIndexes {...props} />;
  return { title, body };
}

function buildRename(props) {
  const title = (
    <React.Fragment>
      <i className="ico-edit" />
      <strong>Rename</strong>
    </React.Fragment>
  );
  const body = <Rename {...props} />;
  return { title, body };
}

function buildReplacement(props) {
  const title = (
    <React.Fragment>
      <i className="fas fa-backspace" />
      {" Replacements for "}
      <strong>{_.get(props, "chartData.selectedCol")}</strong>
    </React.Fragment>
  );
  const body = <CreateReplacement {...props} />;
  return { title, body };
}

function buildError(props) {
  const title = (
    <React.Fragment>
      <i className="ico-cancel" />
      <strong>Error</strong>
    </React.Fragment>
  );
  const body = <Error {...props} />;
  return { title, body };
}

function buildInstances(props) {
  const title = (
    <React.Fragment>
      <i className="ico-apps" />
      <strong>{"Active D-Tale Instances"}</strong>
    </React.Fragment>
  );
  const body = <Instances {...props} />;
  return { title, body };
}

function buildCode(props) {
  const title = (
    <React.Fragment>
      <i className="ico-code" />
      <strong>Code Export</strong>
    </React.Fragment>
  );
  const body = <CodeExport {...props} />;
  return { title, body };
}

function buildVariance(props) {
  const title = (
    <React.Fragment>
      <i className="fas fa-chart-bar" />
      {` Variance Report for "`}
      <strong>{_.get(props, "chartData.selectedCol")}</strong>
      {`"`}
    </React.Fragment>
  );
  const body = <Variance {...props} />;
  return { title, body };
}

function buildUpload(props) {
  const title = (
    <React.Fragment>
      <i className="ico-file-upload" />
      <strong>Upload CSV</strong>
    </React.Fragment>
  );
  const body = <Upload {...props} />;
  return { title, body };
}

function buildDuplicates() {
  const title = (
    <React.Fragment>
      <i className="fas fa-clone" />
      <strong>{"Duplicates"}</strong>
    </React.Fragment>
  );
  const body = <Duplicates />;
  return { title, body };
}

export function buildBodyAndTitle(props) {
  switch (_.get(props, "chartData.type")) {
    case "filter":
      return buildFilter();
    case "column-analysis":
      return buildColumnAnalysis(props);
    case "correlations":
      return buildCorrelations(props);
    case "build":
      return buildCreateColumn();
    case "type-conversion":
      return buildTypeConversion(props);
    case "reshape":
      return buildReshape();
    case "about":
      return buildAbout();
    case "confirm":
      return buildConfirm(props);
    case "range":
      return buildRange(props);
    case "xarray-dimensions":
      return xarrayDimensions(props);
    case "xarray-indexes":
      return xarrayIndexes(props);
    case "rename":
      return buildRename(props);
    case "replacement":
      return buildReplacement(props);
    case "error":
      return buildError(props);
    case "instances":
      return buildInstances(props);
    case "code":
      return buildCode(props);
    case "variance":
      return buildVariance(props);
    case "upload":
      return buildUpload(props);
    case "duplicates":
      return buildDuplicates();
  }
  return { body: null, title: null };
}
