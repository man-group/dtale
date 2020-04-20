import chroma from "chroma-js";
import _ from "lodash";

import { exports as gu } from "./gridUtils";

const heatMap = chroma.scale(["red", "yellow", "green"]).domain([0, 0.5, 1]);

const heatMapBackground = ({ raw, view }, { min, max }) => {
  if (view === "") {
    return {};
  }
  const factor = min * -1;
  return { background: heatMap((raw + factor) / (max + factor)) };
};

const dtypeHighlighting = ({ name, dtype }) => {
  if (name === gu.IDX) {
    return {};
  }
  const lowerDtype = (dtype || "").toLowerCase();
  const colType = gu.findColType(lowerDtype);
  if (_.startsWith(lowerDtype, "category")) {
    return { background: "#E1BEE7" };
  } else if (_.startsWith(lowerDtype, "timedelta")) {
    return { background: "#FFCC80" };
  } else if (colType === "float") {
    return { background: "#B2DFDB" };
  } else if (colType === "int") {
    return { background: "#BBDEFB" };
  } else if (colType === "date") {
    return { background: "#F8BBD0" };
  } else if (colType === "string") {
    return {};
  } else if (_.startsWith(lowerDtype, "bool")) {
    return { background: "#FFF59D" };
  }
  return {};
};

const missingHighlighting = ({ name, dtype, hasMissing }, value) => {
  if (name === gu.IDX || !hasMissing) {
    return {};
  }
  if (value === "nan") {
    return { background: "#FFF59D" };
  }
  const lowerDtype = (dtype || "").toLowerCase();
  const colType = gu.findColType(lowerDtype);
  if (colType === "string") {
    if ((value || "") === "") {
      return { background: "#FFCC80" };
    }
    if (_.trim(value) === "") {
      return { background: "#FFCC80" };
    }
  }
  return {};
};

const buildOutlierScales = colCfg => {
  const { name, min, max, hasOutliers, outlierRange } = colCfg;
  const updatedColCfg = _.assignIn({}, colCfg);
  if (name === gu.IDX || !hasOutliers) {
    return updatedColCfg;
  }
  if (!_.has(outlierRange, "lowerScale")) {
    updatedColCfg.outlierRange.lowerScale = chroma.scale(["dodgerblue", "white"]).domain([min, outlierRange.lower]);
  }
  if (!_.has(outlierRange, "upperScale")) {
    updatedColCfg.outlierRange.upperScale = chroma.scale(["white", "red"]).domain([outlierRange.upper, max]);
  }
  return updatedColCfg;
};

const outlierHighlighting = ({ name, dtype, hasOutliers, outlierRange }, { raw }) => {
  if (name === gu.IDX || !hasOutliers) {
    return {};
  }
  const lowerDtype = (dtype || "").toLowerCase();
  const colType = gu.findColType(lowerDtype);
  if (_.includes(["float", "int"], colType)) {
    if (raw < outlierRange.lower) {
      return { background: outlierRange.lowerScale(raw) };
    } else if (raw > outlierRange.upper) {
      return { background: outlierRange.upperScale(raw) };
    }
  }
  return {};
};

const updateBackgroundStyles = (state, valueStyle, colCfg, rec) => {
  switch (state.backgroundMode) {
    case "heatmap-col":
      return _.assignIn(heatMapBackground(rec, colCfg), valueStyle);
    case "heatmap-all":
      return colCfg.name === gu.IDX ? valueStyle : _.assignIn(heatMapBackground(rec, state), valueStyle);
    case "dtypes":
      return _.assignIn(dtypeHighlighting(colCfg), valueStyle);
    case "missing":
      return _.assignIn(missingHighlighting(colCfg, rec.view), valueStyle);
    case "outliers":
      return _.assignIn(outlierHighlighting(colCfg, rec), valueStyle);
    default:
      return valueStyle;
  }
};

export default {
  missingIcon: String.fromCodePoint(10071), // "!" emoji
  outlierIcon: String.fromCodePoint(11088), // star emoji
  dtypeHighlighting,
  updateBackgroundStyles,
  buildOutlierScales,
};
