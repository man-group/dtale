import chroma from "chroma-js";
import _ from "lodash";
import moment from "moment";
import numeral from "numeral";

import { measureText } from "./MeasureText";
import menuFuncs from "./dataViewerMenuUtils";

const IDX = "dtale_index";
const DEFAULT_COL_WIDTH = 70;

numeral.nullFormat("");

function isStringCol(dtype) {
  return _.some(["string", "object", "unicode"], s => _.startsWith(dtype, s));
}

function isIntCol(dtype) {
  return _.startsWith(dtype, "int");
}

function isFloatCol(dtype) {
  return _.startsWith(dtype, "float");
}

function isDateCol(dtype) {
  return _.some(["timestamp", "datetime"], s => _.startsWith(dtype, s));
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

function buildValue({ name, dtype }, rawValue, { columnFormats }) {
  if (!_.isUndefined(rawValue)) {
    const fmt = _.get(columnFormats, [name, "fmt"]);
    switch (findColType((dtype || "").toLowerCase())) {
      case "float":
        return buildNumeral(rawValue, fmt || "0.00");
      case "int":
        return buildNumeral(rawValue, fmt || "0");
      case "date":
        return fmt ? moment(new Date(rawValue)).format(fmt) : rawValue;
      case "string":
      default:
        return fmt ? _.truncate(rawValue, { length: fmt }) : rawValue;
    }
  }
  return "";
}

function buildDataProps({ name, dtype }, rawValue, { columnFormats }) {
  return {
    raw: rawValue,
    view: buildValue({ name, dtype }, rawValue, { columnFormats }),
    style: menuFuncs.buildStyling(
      rawValue,
      findColType((dtype || "").toLowerCase()),
      _.get(columnFormats, [name, "style"], {})
    ),
  };
}

function getHeatActive(column) {
  return (_.has(column, "min") || column.name === IDX) && column.visible;
}

function getActiveCols({ columns, heatMapMode }) {
  return _.filter(columns || [], c => (heatMapMode ? getHeatActive(c) : c.visible));
}

function getCol(index, { columns, heatMapMode }) {
  return _.get(getActiveCols({ columns, heatMapMode }), index, {});
}

function getColWidth(index, { columns, heatMapMode }) {
  return _.get(getCol(index, { columns, heatMapMode }), "width", DEFAULT_COL_WIDTH);
}

function getRanges(array) {
  const ranges = [];
  let rstart, rend;
  for (let i = 0; i < array.length; i++) {
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

function calcColWidth({ name, dtype }, { data, rowCount, sortInfo }) {
  let w = DEFAULT_COL_WIDTH;
  if (name === IDX) {
    w = measureText(rowCount - 1 + "");
    w = w < DEFAULT_COL_WIDTH ? DEFAULT_COL_WIDTH : w;
  } else {
    const sortDir = (_.find(sortInfo, ([col, _dir]) => col === name) || [null, null])[1];
    const headerWidth = measureText(name) + (_.includes(["ASC", "DESC"], sortDir) ? 10 : 0);
    switch (findColType((dtype || "").toLowerCase())) {
      case "date": {
        let maxText = _.last(_.sortBy(data, d => _.get(d, [name, "view", "length"], 0)));
        maxText = _.get(maxText, [name, "view"], "").replace(new RegExp("[0-9]", "g"), "0"); // zero is widest number
        w = measureText(maxText);
        break;
      }
      case "int":
      case "float": {
        const maxText = _.last(_.sortBy(data, d => _.get(d, [name, "view", "length"], 0)));
        w = measureText(_.get(maxText, [name, "view"]));
        break;
      }
      case "string":
      default: {
        const upperWords = _.uniq(_.map(data, d => _.get(d, [name, "view"]).toUpperCase()));
        w = _.max(_.map(upperWords, measureText));
        break;
      }
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
    styleBottomLeftGrid: {
      borderRight: "2px solid #aaa",
      backgroundColor: "#f7f7f7",
    },
    styleTopLeftGrid: _.assignIn(
      { height: headerHeight + 15 },
      {
        borderBottom: "2px solid #aaa",
        borderRight: "2px solid #aaa",
        fontWeight: "bold",
      }
    ),
    styleTopRightGrid: {
      height: headerHeight + 15,
      borderBottom: "2px solid #aaa",
      fontWeight: "bold",
    },
    enableFixedColumnScroll: true,
    enableFixedRowScroll: true,
    hideTopRightGridScrollbar: true,
    hideBottomLeftGridScrollbar: true,
  };
}

const heatMap = chroma.scale(["red", "yellow", "green"]).domain([0, 0.5, 1]);

function heatMapBackground({ raw, view }, { min, max }) {
  if (view === "") {
    return {};
  }
  const factor = min * -1;
  return { background: heatMap((raw + factor) / (max + factor)) };
}

function dtypeHighlighting({ name, dtype }) {
  if (name === IDX) {
    return {};
  }
  const lowerDtype = (dtype || "").toLowerCase();
  const colType = findColType(lowerDtype);
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
}

const SORT_PROPS = [
  {
    dir: "ASC",
    full: { label: "Sort Ascending", icon: "fa fa-sort-down ml-4 mr-4" },
    col: { label: "Asc", icon: "fa fa-sort-down" },
  },
  {
    dir: "DESC",
    full: { label: "Sort Descending", icon: "fa fa-sort-up ml-4 mr-4" },
    col: { label: "Desc", icon: "fa fa-sort-up" },
  },
  {
    dir: "NONE",
    full: { label: "Clear Sort", icon: "fa fa-sort ml-4 mr-4" },
    col: { label: "None", icon: "fa fa-sort" },
  },
];

function buildToggleId(colName) {
  return `col-${_.join(_.split(colName, " "), "_")}-toggle`;
}

function buildState(props) {
  return {
    ...buildGridStyles(),
    columnFormats: _.get(props, "settings.formats", {}),
    overscanColumnCount: 0,
    overscanRowCount: 5,
    rowHeight: ({ index }) => (index == 0 ? HEADER_HEIGHT : ROW_HEIGHT),
    rowCount: 0,
    fixedColumnCount: _.size(_.concat(_.get(props, "settings.locked", []), [IDX])),
    fixedRowCount: 1,
    data: {},
    loading: false,
    ids: [0, 55],
    loadQueue: [],
    columns: [],
    query: _.get(props, "settings.query", ""),
    columnFilters: _.get(props, "settings.columnFilters", {}),
    sortInfo: _.get(props, "settings.sort", []),
    selectedCols: [],
    menuOpen: false,
    formattingOpen: false,
    triggerResize: false,
    heatMapMode: false,
    dtypeHighlighting: false,
  };
}

function noHidden(columns) {
  return !_.some(columns, { visible: false });
}

function hasNoInfo({ sortInfo, query, columns, columnFilters }) {
  return _.isEmpty(sortInfo) && _.isEmpty(query) && noHidden(columns) && _.isEmpty(columnFilters);
}

export {
  buildDataProps,
  getActiveCols,
  getCol,
  getColWidth,
  getRanges,
  calcColWidth,
  findColType,
  isDateCol,
  isStringCol,
  IDX,
  buildGridStyles,
  ROW_HEIGHT,
  HEADER_HEIGHT,
  heatMapBackground,
  dtypeHighlighting,
  SORT_PROPS,
  buildToggleId,
  buildState,
  noHidden,
  hasNoInfo,
};
