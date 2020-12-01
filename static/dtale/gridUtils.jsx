import _ from "lodash";
import moment from "moment";
import numeral from "numeral";

import { measureText } from "./MeasureText";
import menuFuncs from "./menu/dataViewerMenuUtils";
import { buildRangeState } from "./rangeSelectUtils";

const EXPORTS = {};

EXPORTS.IDX = "dtale_index";
const DEFAULT_COL_WIDTH = 70;

numeral.nullFormat("");

EXPORTS.isStringCol = dtype => _.some(["string", "object", "unicode"], s => _.startsWith(dtype, s));
EXPORTS.isIntCol = dtype => _.startsWith(dtype, "int");
EXPORTS.isFloatCol = dtype => _.startsWith(dtype, "float");
EXPORTS.isDateCol = dtype => _.some(["timestamp", "datetime"], s => _.startsWith(dtype, s));

EXPORTS.getDtype = (col, columns) => _.get(_.find(columns, { name: col }, {}), "dtype");

EXPORTS.findColType = dtype => {
  if (EXPORTS.isStringCol(dtype)) {
    return "string";
  }
  if (EXPORTS.isIntCol(dtype)) {
    return "int";
  }
  if (EXPORTS.isFloatCol(dtype)) {
    return "float";
  }
  if (EXPORTS.isDateCol(dtype)) {
    return "date";
  }
  return "unknown";
};

function buildNumeral(val, fmt) {
  return _.includes(["nan", "inf", "-", ""], val) ? val : numeral(val).format(fmt);
}

function buildString(val, { truncate }) {
  return truncate ? _.truncate(val, { length: truncate }) : val;
}

function buildValue({ name, dtype }, rawValue, { columnFormats, settings }) {
  if (!_.isUndefined(rawValue)) {
    const fmt = _.get(columnFormats, [name, "fmt"]);
    switch (EXPORTS.findColType((dtype || "").toLowerCase())) {
      case "float":
        return buildNumeral(rawValue, fmt || `0.${_.repeat("0", settings.precision ?? 2)}`);
      case "int":
        return buildNumeral(rawValue, fmt || "0");
      case "date":
        return fmt ? moment(new Date(rawValue)).format(fmt) : rawValue;
      case "string":
      default:
        return buildString(rawValue, fmt ?? {});
    }
  }
  return "";
}

EXPORTS.buildDataProps = ({ name, dtype }, rawValue, { columnFormats, settings }) => ({
  raw: rawValue,
  view: buildValue({ name, dtype }, rawValue, { columnFormats, settings }),
  style: menuFuncs.buildStyling(
    rawValue,
    EXPORTS.findColType((dtype || "").toLowerCase()),
    _.get(columnFormats, [name, "style"], {})
  ),
});

function getHeatActive(column) {
  return (_.has(column, "min") || column.name === EXPORTS.IDX) && column.visible;
}

EXPORTS.getActiveCols = ({ columns, backgroundMode }) => {
  const heatmapActive = _.startsWith(backgroundMode, "heatmap");
  return _.filter(columns || [], c => (heatmapActive ? getHeatActive(c) : c.visible));
};

EXPORTS.getCol = (index, { columns, backgroundMode }) =>
  _.get(EXPORTS.getActiveCols({ columns, backgroundMode }), index, {});

EXPORTS.getColWidth = (index, { columns, backgroundMode }) =>
  _.get(EXPORTS.getCol(index, { columns, backgroundMode }), "width", DEFAULT_COL_WIDTH);

EXPORTS.getRanges = array => {
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

EXPORTS.calcColWidth = (
  { name, dtype, hasMissing, hasOutliers, lowVariance },
  { data, rowCount, sortInfo, backgroundMode }
) => {
  let w;
  if (name === EXPORTS.IDX) {
    w = measureText(rowCount - 1 + "");
    w = w < DEFAULT_COL_WIDTH ? DEFAULT_COL_WIDTH : w;
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
    switch (EXPORTS.findColType((dtype || "").toLowerCase())) {
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
};

EXPORTS.ROW_HEIGHT = 25;
EXPORTS.HEADER_HEIGHT = 35;

EXPORTS.THEMES = ["light", "dark"];

EXPORTS.isLight = theme => "light" === theme || !_.includes(EXPORTS.THEMES, theme);

EXPORTS.buildGridStyles = (theme = "light", headerHeight = EXPORTS.HEADER_HEIGHT) => ({
  style: { border: "1px solid #ddd" },
  styleBottomLeftGrid: {
    borderRight: "2px solid #aaa",
    backgroundColor: EXPORTS.isLight(theme) ? "#f7f7f7" : "inherit",
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

EXPORTS.getTotalRange = columns => {
  const activeCols = EXPORTS.getActiveCols({ columns });
  return {
    min: _.min(_.map(activeCols, "min")),
    max: _.max(_.map(activeCols, "max")),
  };
};

EXPORTS.SORT_PROPS = [
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

EXPORTS.buildToggleId = colName => `col-${_.join(_.split(colName, " "), "_")}-toggle`;

EXPORTS.buildState = props => ({
  ...EXPORTS.buildGridStyles(props.theme),
  columnFormats: _.get(props, "settings.formats", {}),
  nanDisplay: _.get(props, "settings.nanDisplay"),
  overscanColumnCount: 0,
  overscanRowCount: 5,
  rowHeight: ({ index }) => (index == 0 ? EXPORTS.HEADER_HEIGHT : EXPORTS.ROW_HEIGHT),
  rowCount: 0,
  fixedColumnCount: _.size(_.concat(_.get(props, "settings.locked", []), [EXPORTS.IDX])),
  fixedRowCount: 1,
  data: {},
  loading: false,
  ids: [0, 55],
  loadQueue: [],
  columns: [],
  query: _.get(props, "settings.query", ""),
  columnFilters: _.get(props, "settings.columnFilters", {}),
  outlierFilters: _.get(props, "settings.outlierFilters", {}),
  sortInfo: _.get(props, "settings.sort", []),
  selectedCols: [],
  menuOpen: false,
  formattingOpen: false,
  triggerResize: false,
  backgroundMode: null,
  rangeHighlight: {},
  ...buildRangeState(),
});

EXPORTS.noHidden = columns => !_.some(columns, { visible: false });

EXPORTS.noFilters = ({ query, columnFilters, outlierFilters }) =>
  _.isEmpty(query) && _.isEmpty(columnFilters) && _.isEmpty(outlierFilters);

EXPORTS.hasNoInfo = ({ sortInfo, query, columns, columnFilters, outlierFilters }) => {
  const hideSort = _.isEmpty(sortInfo);
  const hideFilter = EXPORTS.noFilters({
    query,
    columnFilters,
    outlierFilters,
  });
  const hideHidden = EXPORTS.noHidden(columns);
  return hideSort && hideFilter && hideHidden;
};

EXPORTS.updateColWidths = (currState, newState) =>
  _.map(_.get(newState, "columns", currState.columns), c =>
    _.assignIn(c, {
      width: EXPORTS.calcColWidth(c, _.assignIn(currState, newState)),
    })
  );

function buildColMap(columns) {
  return _.reduce(columns, (res, c) => _.assign(res, { [c.name]: c }), {});
}

EXPORTS.refreshColumns = (data, columns, state) => {
  const currColumns = buildColMap(columns);
  const newCols = _.map(
    _.filter(data.columns, ({ name }) => !_.has(currColumns, name)),
    c => _.assignIn({ locked: false, width: EXPORTS.calcColWidth(c, state) }, c)
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
  return _.assignIn({ ...state, columns: finalColumns }, EXPORTS.getTotalRange(finalColumns));
};

export { EXPORTS as exports };
