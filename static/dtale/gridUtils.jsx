/* eslint max-lines: "off" */
import _ from "lodash";
import moment from "moment";
import numeral from "numeral";

import { measureText } from "./MeasureText";
import menuFuncs from "./menu/dataViewerMenuUtils";
import { buildRangeState } from "./rangeSelectUtils";
import * as actions from "../actions/dtale";
import { openChart } from "../actions/charts";

export const IDX = "dtale_index";
const DEFAULT_COL_WIDTH = 70;

numeral.nullFormat("");

export const isStringCol = dtype => _.some(["string", "object", "unicode"], s => _.startsWith(dtype, s));
export const isIntCol = dtype => _.some(["int", "uint"], s => _.startsWith(dtype, s));
export const isFloatCol = dtype => _.startsWith(dtype, "float");
export const isDateCol = dtype => _.some(["timestamp", "datetime"], s => _.startsWith(dtype, s));

export const getDtype = (col, columns) => _.get(_.find(columns, { name: col }, {}), "dtype");

export const findColType = dtype => {
  const lowerDtype = (dtype || "").toLowerCase();
  if (isStringCol(lowerDtype)) {
    return "string";
  } else if (isIntCol(lowerDtype)) {
    return "int";
  } else if (isFloatCol(lowerDtype)) {
    return "float";
  } else if (isDateCol(lowerDtype)) {
    return "date";
  }
  return "unknown";
};

function buildNumeral(val, fmt, nanDisplay) {
  return _.includes(["nan", "inf", "-", "", nanDisplay], val) ? val : numeral(val).format(fmt);
}

function buildString(val, { truncate }) {
  return truncate ? _.truncate(val, { length: truncate }) : val;
}

function buildValue({ name, dtype }, rawValue, { columnFormats, settings }) {
  if (!_.isUndefined(rawValue)) {
    const fmt = _.get(columnFormats, [name, "fmt"]);
    switch (findColType(dtype)) {
      case "float":
        return buildNumeral(rawValue, fmt || `0.${_.repeat("0", settings.precision ?? 2)}`, settings.nanDisplay);
      case "int":
        return buildNumeral(rawValue, fmt || "0", settings.nanDisplay);
      case "date":
        return fmt ? moment(new Date(rawValue)).format(fmt) : rawValue;
      case "string":
      default:
        return buildString(rawValue, fmt ?? {});
    }
  }
  return "";
}

export const buildDataProps = ({ name, dtype }, rawValue, { columnFormats, settings }) => ({
  raw: rawValue,
  view: buildValue({ name, dtype }, rawValue, { columnFormats, settings }),
  style: menuFuncs.buildStyling(rawValue, findColType(dtype), _.get(columnFormats, [name, "style"], {})),
});

function getHeatActive(column) {
  return (_.has(column, "min") || column.name === IDX) && column.visible;
}

export const heatmapActive = backgroundMode => _.includes(["heatmap-col", "heatmap-all"], backgroundMode);
export const heatmapAllActive = backgroundMode => _.includes(["heatmap-col-all", "heatmap-all-all"], backgroundMode);

export const getActiveCols = ({ columns, backgroundMode }) =>
  _.filter(columns || [], c => (heatmapActive(backgroundMode) ? getHeatActive(c) : c.visible));

export const getCol = (index, { columns, backgroundMode }) =>
  _.get(getActiveCols({ columns, backgroundMode }), index, {});

export const getColWidth = (index, { columns, backgroundMode }, props) => {
  const col = getCol(index, { columns, backgroundMode });
  let width = col.width;
  if (props.verticalHeaders) {
    width = col.resized ? col.width : col.dataWidth ?? col.width;
  }
  return width ?? DEFAULT_COL_WIDTH;
};

export const ROW_HEIGHT = 25;
export const HEADER_HEIGHT = 35;

export const getRowHeight = (index, state, props) => {
  if (index === 0) {
    if (props.verticalHeaders) {
      const cols = getActiveCols(state);
      const maxWidth = _.max(_.map(cols, col => col.headerWidth ?? col.width)) ?? HEADER_HEIGHT;
      return maxWidth < HEADER_HEIGHT ? HEADER_HEIGHT : maxWidth;
    }
    return HEADER_HEIGHT;
  }
  return props.maxRowHeight ?? ROW_HEIGHT;
};

export const getRanges = array => {
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
};

const calcDataWidth = (name, dtype, data) => {
  switch (findColType(dtype)) {
    case "date": {
      let maxText = _.last(_.sortBy(data, d => _.get(d, [name, "view", "length"], 0)));
      maxText = _.get(maxText, [name, "view"], "").replace(new RegExp("[0-9]", "g"), "0"); // zero is widest number
      return measureText(maxText);
    }
    case "int":
    case "float": {
      const maxText = _.last(_.sortBy(data, d => _.get(d, [name, "view", "length"], 0)));
      return measureText(_.get(maxText, [name, "view"]));
    }
    case "string":
    default: {
      const upperWords = _.uniq(_.map(data, d => _.get(d, [name, "view"], "").toUpperCase()));
      return _.max(_.map(upperWords, measureText));
    }
  }
};

export const calcColWidth = (
  { name, dtype, hasMissing, hasOutliers, lowVariance, resized, width, headerWidth, dataWidth },
  { data, rowCount, sortInfo, backgroundMode, maxColumnWidth }
) => {
  if (resized === true) {
    return { width, headerWidth, dataWidth };
  }
  let w;
  if (name === IDX) {
    w = measureText(rowCount - 1 + "");
    w = w < DEFAULT_COL_WIDTH ? DEFAULT_COL_WIDTH : w;
    w = { width: w, headerWidth: w, dataWidth: w };
  } else {
    const sortDir = (_.find(sortInfo, ([col, _dir]) => col === name) || [null, null])[1];
    let headerWidth = measureText(name) + (_.includes(["ASC", "DESC"], sortDir) ? 10 : 0);
    if (backgroundMode === "missing" && hasMissing) {
      headerWidth += 10; // "!" emoji
    } else if (backgroundMode === "outliers" && hasOutliers) {
      headerWidth += 15; // star emoji
    } else if (backgroundMode === "lowVariance" && lowVariance) {
      headerWidth += 15; // star emoji
    }
    const dataWidth = calcDataWidth(name, dtype, data) ?? DEFAULT_COL_WIDTH;
    w = headerWidth > dataWidth ? headerWidth : dataWidth;
    w = maxColumnWidth && w >= maxColumnWidth ? { width: maxColumnWidth, resized: true } : { width: w };
    w.headerWidth = headerWidth;
    w.dataWidth = dataWidth;
  }
  return w;
};

export const THEMES = ["light", "dark"];

export const isLight = theme => "light" === theme || !_.includes(THEMES, theme);

export const buildGridStyles = (theme = "light", headerHeight = HEADER_HEIGHT) => ({
  style: { border: "1px solid #ddd" },
  styleBottomLeftGrid: {
    borderRight: "2px solid #aaa",
    backgroundColor: isLight(theme) ? "#f7f7f7" : "inherit",
  },
  styleTopLeftGrid: _.assignIn(
    { height: headerHeight },
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
});

export const getTotalRange = columns => {
  const activeCols = getActiveCols({ columns });
  return {
    min: _.min(_.map(activeCols, "min")),
    max: _.max(_.map(activeCols, "max")),
  };
};

const loadBackgroundMode = props => {
  const backgroundMode = _.get(props, "settings.backgroundMode");
  if (backgroundMode) {
    return backgroundMode;
  }
  if (_.size(_.get(props, "settings.rangeHighlight"))) {
    return "range";
  }
  return null;
};

export const buildState = props => ({
  ...buildGridStyles(props.theme),
  columnFormats: _.get(props, "settings.columnFormats", {}),
  nanDisplay: _.get(props, "settings.nanDisplay"),
  overscanColumnCount: 0,
  overscanRowCount: 5,
  rowCount: 0,
  fixedColumnCount: _.size(props.settings?.locked ?? []) + 1, // add 1 for IDX column
  fixedRowCount: 1,
  data: {},
  loading: false,
  ids: [0, 55],
  loadQueue: [],
  columns: [],
  selectedCols: [],
  menuOpen: false,
  formattingOpen: false,
  triggerResize: false,
  backgroundMode: loadBackgroundMode(props),
  rangeHighlight: _.get(props, "settings.rangeHighlight", {}),
  ...buildRangeState(),
});

export const noHidden = columns => !_.some(columns, { visible: false });

export const predefinedHasValue = value => {
  if (value?.value === undefined) {
    return false;
  }
  if (Array.isArray(value.value) && _.isEmpty(value.value)) {
    return false;
  }
  return true;
};
export const filterPredefined = filters => _.pickBy(filters, value => value.active && predefinedHasValue(value));
export const noFilters = ({ query, columnFilters, outlierFilters, predefinedFilters }) =>
  _.isEmpty(query) &&
  _.isEmpty(columnFilters) &&
  _.isEmpty(outlierFilters) &&
  _.isEmpty(filterPredefined(predefinedFilters));

export const hasNoInfo = ({ sortInfo, query, columns, columnFilters, outlierFilters, predefinedFilters }) => {
  const hideSort = _.isEmpty(sortInfo);
  const hideFilter = noFilters({ query, columnFilters, outlierFilters, predefinedFilters });
  const hideHidden = noHidden(columns);
  return hideSort && hideFilter && hideHidden;
};

export function convertCellIdxToCoords(cellIdx) {
  return _.map((cellIdx || "").split("|"), v => parseInt(v));
}

export function getCell(cellIdx, gridState) {
  const [colIndex, rowIndex] = convertCellIdxToCoords(cellIdx);
  const colCfg = getCol(colIndex, gridState);
  const rec = _.get(gridState, ["data", rowIndex - 1, colCfg.name], {});
  return { colCfg, rec, colIndex, rowIndex };
}

export function gridHeight(height, columns, props) {
  const noInfo = hasNoInfo({ ...props.settings, columns });
  let gridHeight = height;
  gridHeight -= noInfo ? 3 : 30;
  gridHeight -= props.ribbonMenuOpen ? 25 : 0;
  gridHeight -= props.editedTextAreaHeight;
  return gridHeight;
}

export const updateColWidths = (currState, newState, settings, maxColumnWidth) =>
  _.map(_.get(newState, "columns", currState.columns), c => ({
    ...c,
    ...calcColWidth(c, { ...currState, ...newState, ...settings, maxColumnWidth }),
  }));

function buildColMap(columns) {
  return _.reduce(columns, (res, c) => _.assign(res, { [c.name]: c }), {});
}

export const refreshColumns = (data, columns, state, settings, maxColumnWidth) => {
  const currColumns = buildColMap(columns);
  const newCols = _.map(
    _.filter(data.columns, ({ name }) => !_.has(currColumns, name)),
    c => ({
      ...c,
      locked: false,
      ...calcColWidth(c, { ...state, ...settings, maxColumnWidth }),
    })
  );
  const updatedColumns = buildColMap(data.columns);
  const finalColumns = _.concat(
    _.map(columns, c => {
      if (c.dtype !== updatedColumns[c.name].dtype) {
        return { ...c, ...updatedColumns[c.name] };
      }
      return c;
    }),
    newCols
  );
  return _.assignIn({ ...state, columns: finalColumns }, getTotalRange(finalColumns));
};

export const toggleColumns = ({ columns }, { columnsToToggle }) => ({
  columns: columns.map(col => ({
    ...col,
    visible: columnsToToggle[col.name] ?? col.visible,
  })),
  triggerResize: true,
});

export const reduxState = state => ({
  ..._.pick(state, [
    "dataId",
    "iframe",
    "theme",
    "settings",
    "menuPinned",
    "ribbonMenuOpen",
    "dataViewerUpdate",
    "maxColumnWidth",
    "maxRowHeight",
    "editedTextAreaHeight",
  ]),
  verticalHeaders: _.get(state, "settings.verticalHeaders", false),
});

export const reduxDispatch = dispatch => ({
  closeColumnMenu: () => dispatch(actions.closeColumnMenu()),
  openChart: chartProps => dispatch(openChart(chartProps)),
  updateFilteredRanges: query => dispatch(actions.updateFilteredRanges(query)),
  clearDataViewerUpdate: () => dispatch({ type: "clear-data-viewer-update" }),
});
