/* eslint max-lines: "off" */
import _ from "lodash";
import React from "react";

import About from "./About";
import { CodeExport } from "./CodeExport";
import { Confirmation } from "./Confirmation";
import { CopyRangeToClipboard } from "./CopyRangeToClipboard";
import Correlations from "./Correlations";
import { Error } from "./ErrorPopup";
import { RangeHighlight } from "./RangeHighlight";
import { Rename } from "./Rename";
import { XArrayDimensions } from "./XArrayDimensions";
import { XArrayIndexes } from "./XArrayIndexes";
import { ColumnAnalysis } from "./analysis/ColumnAnalysis";
import { CreateColumn } from "./create/CreateColumn";
import { Duplicates } from "./duplicates/Duplicates";
import { FilterPopup } from "./filter/FilterPopup";
import Instances from "./instances/Instances";
import PredictivePowerScore from "./pps/PredictivePowerScore";
import { CreateReplacement } from "./replacement/CreateReplacement";
import { Reshape } from "./reshape/Reshape";
import { Upload } from "./upload/Upload";
import { Variance } from "./variance/Variance";

function buildFilter(props) {
  const title = (
    <React.Fragment>
      <i className="fa fa-filter" />
      <strong>{props.t("filter:Custom Filter")}</strong>
    </React.Fragment>
  );
  const body = <FilterPopup />;
  return { title, body };
}

function buildColumnAnalysis(props) {
  const title = (
    <React.Fragment>
      <i className="ico-equalizer" />
      {props.t(" Column Analysis for ", { ns: "popup" })}
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

function buildPps(props) {
  const title = (
    <React.Fragment>
      <i className="ico-bubble-chart" />
      <strong>{props.t("Predictive Power Score", { ns: "menu" })}</strong>
    </React.Fragment>
  );
  const body = <PredictivePowerScore propagateState={props.propagateState} />;
  return { title, body };
}

function buildCreateColumn(props) {
  const title = (
    <React.Fragment>
      <i className="ico-build" />
      <strong>{props.t("Dataframe Functions", { ns: "menu" })}</strong>
    </React.Fragment>
  );
  const body = <CreateColumn />;
  return { title, body };
}

function buildTypeConversion(props) {
  const title = (
    <React.Fragment>
      <i className="ico-build" />
      {props.t(" Type Conversion of ", { ns: "popup" })}
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

function buildCleaners(props) {
  const title = (
    <React.Fragment>
      <i className="ico-build" />
      {props.t(" Clean ", { ns: "popup" })}
      <strong>{_.get(props, "chartData.selectedCol")}</strong>
    </React.Fragment>
  );
  const body = (
    <CreateColumn
      prePopulated={{
        type: "cleaning",
        cfg: { col: _.get(props, "chartData.selectedCol") },
      }}
    />
  );
  return { title, body };
}

function buildReshape(props) {
  const title = (
    <React.Fragment>
      <i className="fas fa-tools" />
      <strong>{props.t("Summarize Data", { ns: "menu" })}</strong>
    </React.Fragment>
  );
  const body = <Reshape />;
  return { title, body };
}

function buildTimeseries(props) {
  const title = (
    <React.Fragment>
      <i className="ico-schedule" />
      <strong>{props.t("Timeseries", { ns: "menu" })}</strong>
    </React.Fragment>
  );
  const body = <Reshape operation="timeseries" />;
  return { title, body };
}

function buildAbout(props) {
  const title = (
    <React.Fragment>
      <i className="fa fa-info-circle la-lg" />
      <strong>{props.t("About")}</strong>
    </React.Fragment>
  );
  const body = <About />;
  return { title, body };
}

function buildConfirm(props) {
  const title = (
    <React.Fragment>
      <i className="ico-check-circle" />
      <strong>{props.t("Yes/No", { ns: "popup" })}</strong>
      <small className="pl-3">({_.get(props, "chartData.title")})</small>
    </React.Fragment>
  );
  const body = <Confirmation />;
  return { title, body };
}

function buildCopyRange(props) {
  const title = (
    <React.Fragment>
      <i className="fas fa-clipboard" />
      <strong>{props.t("Yes/No", { ns: "popup" })}</strong>
      <small className="pl-3">({_.get(props, "chartData.title")})</small>
    </React.Fragment>
  );
  const body = <CopyRangeToClipboard propagateState={props.propagateState} />;
  return { title, body };
}

function buildRange(props) {
  const title = (
    <React.Fragment>
      <i className="ico-flag" />
      <strong>{props.t("Range Highlights", { ns: "menu" })}</strong>
    </React.Fragment>
  );
  const body = <RangeHighlight {...props} />;
  return { title, body };
}

function xarrayDimensions(props) {
  const title = (
    <React.Fragment>
      <i className="ico-key" />
      <strong>{props.t("XArray Dimensions", { ns: "menu" })}</strong>
    </React.Fragment>
  );
  const body = <XArrayDimensions {...props} />;
  return { title, body };
}

function xarrayIndexes(props) {
  const title = (
    <React.Fragment>
      <i className="ico-tune" />
      <strong>{props.t("Convert To XArray", { ns: "menu" })}</strong>
    </React.Fragment>
  );
  const body = <XArrayIndexes {...props} />;
  return { title, body };
}

function buildRename(props) {
  const title = (
    <React.Fragment>
      <i className="ico-edit" />
      <strong>{props.t("column_menu:Rename")}</strong>
    </React.Fragment>
  );
  const body = <Rename {...props} />;
  return { title, body };
}

function buildReplacement(props) {
  const title = (
    <React.Fragment>
      <i className="fas fa-backspace" />
      {props.t(" Replacements for ", { ns: "popup" })}
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
      <strong>{props.t("popup:Error")}</strong>
    </React.Fragment>
  );
  const body = <Error {...props} />;
  return { title, body };
}

function buildInstances(props) {
  const title = (
    <React.Fragment>
      <i className="ico-apps" />
      <strong>{props.t("Active D-Tale Instances", { ns: "popup" })}</strong>
    </React.Fragment>
  );
  const body = <Instances {...props} />;
  return { title, body };
}

function buildCode(props) {
  const title = (
    <React.Fragment>
      <i className="ico-code" />
      <strong>{props.t("Code Export", { ns: "menu" })}</strong>
    </React.Fragment>
  );
  const body = <CodeExport {...props} />;
  return { title, body };
}

function buildVariance(props) {
  const title = (
    <React.Fragment>
      <i className="fas fa-chart-bar" />
      {`${props.t(" Variance Report for ", { ns: "popup" })}"`}
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
      <strong>{props.t("Load Data", { ns: "menu" })}</strong>
    </React.Fragment>
  );
  const body = <Upload {...props} />;
  return { title, body };
}

function buildDuplicates(props) {
  const title = (
    <React.Fragment>
      <i className="fas fa-clone" />
      <strong>{props.t("Duplicates", { ns: "menu" })}</strong>
    </React.Fragment>
  );
  const body = <Duplicates />;
  return { title, body };
}

const POPUP_MAP = {
  filter: buildFilter,
  "column-analysis": buildColumnAnalysis,
  correlations: buildCorrelations,
  pps: buildPps,
  build: buildCreateColumn,
  "type-conversion": buildTypeConversion,
  cleaners: buildCleaners,
  reshape: buildReshape,
  timeseries: buildTimeseries,
  about: buildAbout,
  confirm: buildConfirm,
  "copy-range": buildCopyRange,
  "copy-column-range": buildCopyRange,
  "copy-row-range": buildCopyRange,
  range: buildRange,
  "xarray-dimensions": xarrayDimensions,
  "xarray-indexes": xarrayIndexes,
  rename: buildRename,
  replacement: buildReplacement,
  error: buildError,
  instances: buildInstances,
  code: buildCode,
  variance: buildVariance,
  upload: buildUpload,
  duplicates: buildDuplicates,
};

export function buildBodyAndTitle(props) {
  const builder = _.get(POPUP_MAP, _.get(props, "chartData.type"));
  if (builder) {
    return builder(props);
  }
  return { body: null, title: null };
}
