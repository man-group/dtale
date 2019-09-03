import _ from "lodash";
import numeral from "numeral";

import { buildStyling } from "./Formatting";
import { measureText } from "./MeasureText";

const IDX = "dtale_index";
const DEFAULT_COL_WIDTH = 70;

numeral.nullFormat("");

function isStringCol(dtype) {
  return _.some(["string", "object"], s => dtype.startsWith(s));
}

function isIntCol(dtype) {
  return dtype.startsWith("int");
}

function isFloatCol(dtype) {
  return dtype.startsWith("float");
}

function isDateCol(dtype) {
  return _.some(["timestamp", "datetime"], s => dtype.startsWith(s));
}

function findColType(dtype) {
  if (isStringCol(dtype)) {
    return "string";
  }
  if (isIntCol(dtype)) {
    return "int";
  }
  if (isFloatCol(dtype)) {
    return "float";
  }
  if (isDateCol(dtype)) {
    return "date";
  }
  return "unknown";
}

function buildNumeral(val, fmt) {
  return numeral(val).format(fmt);
}

function buildValue({ name, dtype }, rawValue, { numberFormats }) {
  if (!_.isUndefined(rawValue)) {
    const fmt = _.get(numberFormats, [name, "fmt"]);
    switch (findColType((dtype || "").toLowerCase())) {
      case "float":
        return buildNumeral(rawValue, fmt || "0.00");
      case "int":
        return buildNumeral(rawValue, fmt || "0");
      default:
        return rawValue;
    }
  }
  return "";
}

function buildDataProps({ name, dtype }, rawValue, { numberFormats }) {
  return {
    raw: rawValue,
    view: buildValue({ name, dtype }, rawValue, { numberFormats }),
    style: buildStyling(rawValue, findColType((dtype || "").toLowerCase()), _.get(numberFormats, [name, "style"], {})),
  };
}

function getColWidth(index, { columns }) {
  return _.get(columns, [index, "width"], DEFAULT_COL_WIDTH);
}

function getRanges(array) {
  var ranges = [],
    rstart,
    rend;
  for (var i = 0; i < array.length; i++) {
    rstart = array[i];
    rend = rstart;
    while (array[i + 1] - array[i] == 1) {
      rend = array[i + 1]; // increment the index if the numbers sequential
      i++;
    }
    ranges.push(rstart == rend ? rstart + "" : rstart + "-" + rend);
  }
  return ranges;
}

function calcColWidth({ name, dtype }, { data, rowCount }) {
  let w = DEFAULT_COL_WIDTH;
  if (name === IDX) {
    w = measureText(rowCount - 1 + "");
    w = w < DEFAULT_COL_WIDTH ? DEFAULT_COL_WIDTH : w;
  } else {
    const headerWidth = measureText(name);
    switch (findColType((dtype || "").toLowerCase())) {
      case "date":
        w = 85;
        break;
      case "int":
      case "float":
      case "string":
        w = measureText(_.last(_.sortBy(data, [name, "raw"]))[name].view);
        break;
      default:
    }
    w = headerWidth > w ? headerWidth : w;
  }
  return w;
}

const ROW_HEIGHT = 25;
const HEADER_HEIGHT = 35;

function buildGridStyles(headerHeight = HEADER_HEIGHT) {
  return {
    style: { border: "1px solid #ddd" },
    styleBottomLeftGrid: { borderRight: "2px solid #aaa", backgroundColor: "#f7f7f7" },
    styleTopLeftGrid: _.assignIn(
      { height: headerHeight + 15 },
      { borderBottom: "2px solid #aaa", borderRight: "2px solid #aaa", fontWeight: "bold" }
    ),
    styleTopRightGrid: { height: headerHeight + 15, borderBottom: "2px solid #aaa", fontWeight: "bold" },
    enableFixedColumnScroll: true,
    enableFixedRowScroll: true,
    hideTopRightGridScrollbar: true,
    hideBottomLeftGridScrollbar: true,
  };
}

export {
  buildDataProps,
  getColWidth,
  getRanges,
  calcColWidth,
  isDateCol,
  IDX,
  buildGridStyles,
  ROW_HEIGHT,
  HEADER_HEIGHT,
};
