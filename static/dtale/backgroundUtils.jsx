import chroma from "chroma-js";
import _ from "lodash";

import { BASE_COLOR, MODES } from "../popups/RangeHighlight";
import * as gu from "./gridUtils";

const RESIZABLE = ["outliers", "missing"];

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

const rangeHighlighting = (state, { name, dtype }, { raw }) => {
  const { rangeHighlight } = state;
  if (name === gu.IDX || !rangeHighlight) {
    return {};
  }
  let range = _.get(rangeHighlight, name);
  if (range === undefined || !range.active) {
    range = _.get(rangeHighlight, "all");
    if (range === undefined || !range.active) {
      range = undefined;
    }
  }
  if (range === undefined) {
    return {};
  }
  const lowerDtype = (dtype || "").toLowerCase();
  const colType = gu.findColType(lowerDtype);
  if (_.includes(["float", "int"], colType)) {
    let styles = {};
    _.forEach(MODES, ([_label, key, filter]) => {
      const { active, value, color } = range[key];
      if (active && !_.isNil(value) && filter(raw, value)) {
        const { r, g, b, a } = color ?? BASE_COLOR;
        styles = { background: `rgba(${r},${g},${b},${a})` };
      }
    });
    return styles;
  }
  return {};
};

const lowVarianceHighlighting = ({ name, lowVariance }) => {
  if (name === gu.IDX || !lowVariance) {
    return {};
  }
  return { background: "rgb(255, 128, 128)" };
};

const updateBackgroundStyles = (state, colCfg, rec) => {
  switch (state.backgroundMode) {
    case `heatmap-col-${colCfg.name}`:
      return heatMapBackground(rec, {
        ...colCfg,
        ..._.get(state, ["filteredRanges", "ranges", colCfg.name]),
      });
    case "heatmap-col":
    case "heatmap-col-all":
      return heatMapBackground(rec, {
        ...colCfg,
        ..._.get(state, ["filteredRanges", "ranges", colCfg.name]),
      });
    case "heatmap-all":
    case "heatmap-all-all": {
      const overall = { ...state, ..._.get(state, "filteredRanges.overall") };
      return colCfg.name === gu.IDX ? {} : heatMapBackground(rec, overall);
    }
    case "dtypes":
      return dtypeHighlighting(colCfg);
    case "missing":
      return missingHighlighting(colCfg, rec.view);
    case "outliers":
      return outlierHighlighting(colCfg, rec);
    case "range":
      return rangeHighlighting(state, colCfg, rec);
    case "lowVariance":
      return lowVarianceHighlighting(colCfg);
    default:
      return {};
  }
};

export default {
  missingIcon: String.fromCodePoint(10071), // "!" emoji
  outlierIcon: String.fromCodePoint(11088), // star emoji
  flagIcon: String.fromCodePoint(128681), // flag emoji
  dtypeHighlighting,
  updateBackgroundStyles,
  buildOutlierScales,
  RESIZABLE,
};
