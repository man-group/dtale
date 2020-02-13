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
  return _.some(["string", "object", "unicode"], s => dtype.startsWith(s));
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

function getActiveCols({ columns }) {
  return _.filter(columns || [], { visible: true });
}

function getCol(index, { columns }) {
  return _.get(getActiveCols({ columns }), index, {});
}

function getColWidth(index, { columns }) {
  return _.get(getCol(index, { columns }), "width", DEFAULT_COL_WIDTH);
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
      case "date":
      case "int":
        w = measureText(_.last(_.sortBy(data, d => _.get(d, [name, "view", "length"], 0)))[name].view);
        break;
      case "float":
        w = measureText(_.last(_.sortBy(data, d => _.get(d, [name, "view", "length"], 0)))[name].view);
        break;
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

function toggleHeatMap({ columns, heatMapMode }) {
  const toggledHeatMapMode = !heatMapMode;
  if (toggledHeatMapMode) {
    const isHeated = c => c.locked || _.has(c, "min");
    return {
      heatMapMode: toggledHeatMapMode,
      columns: _.map(columns, c => _.assignIn({}, c, { visible: isHeated(c) })),
    };
  }
  return {
    heatMapMode: toggledHeatMapMode,
    columns: _.map(columns, c => _.assignIn({}, c, { visible: true })),
  };
}

const heatMap = chroma.scale(["red", "yellow", "green"]).domain([0, 0.5, 1]);

function heatMapBackground({ raw, view }, { min, max }) {
  if (view === "") {
    return 0;
  }
  const factor = min * -1;
  return heatMap((raw + factor) / (max + factor));
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
    sortInfo: _.get(props, "settings.sort", []),
    selectedCols: [],
    menuOpen: false,
    filterOpen: false,
    formattingOpen: false,
    triggerResize: false,
    heatMapMode: false,
  };
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
  toggleHeatMap,
  heatMapBackground,
  SORT_PROPS,
  buildToggleId,
  buildState,
};
