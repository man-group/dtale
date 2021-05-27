import chroma from "chroma-js";
import _ from "lodash";

import { buildURL } from "../../actions/url-utils";
import chartUtils from "../../chartUtils";

function buildState() {
  return {
    chart: null,
    error: null,
    scatterError: null,
    correlations: null,
    selectedCols: [],
    tsUrl: null,
    selectedDate: null,
    tsType: "date",
    scatterUrl: null,
    rolling: false,
    useRolling: false,
    window: 4,
    minPeriods: 1,
    loadingCorrelations: true,
    encodeStrings: false,
    strings: [],
    dummyColMappings: {},
  };
}

function buildGridLoadState({ data, dates, strings, code, dummyColMappings }) {
  const columns = _.map(data, "column");
  const rolling = _.get(dates, "0.rolling", false);
  return {
    correlations: data,
    columns,
    dates,
    strings: strings ?? [],
    dummyColMappings: dummyColMappings ?? {},
    hasDate: _.size(dates) > 0,
    selectedDate: _.get(dates, "0.name", null),
    rolling,
    gridCode: code,
    loadingCorrelations: false,
  };
}

function findDummyCols(cols, dummyColMappings) {
  const dummyCols = [];
  _.forEach(cols, col => {
    const possibleKeys = _.filter(_.keys(dummyColMappings), dummyCol => _.startsWith(col, dummyCol));
    _.forEach(possibleKeys, key => {
      if (_.includes(dummyColMappings[key], col) && !_.includes(dummyCols, key)) {
        dummyCols.push(key);
        return;
      }
    });
  });
  return dummyCols;
}

const colorScale = chroma.scale(["red", "yellow", "green"]).domain([-1, 0, 1]);
const ppsScale = chroma
  .scale(["#f7fbff", "#d0e1f2", "#94c4df", "#4b98c9", "#1664ab", "#08306b"])
  .domain([0, 0.2, 0.4, 0.6, 0.8, 1.0]);
const percent = num => (num === "N/A" ? num : `${_.round(num * 100, 2)}%`);

function createScatter(ctx, data, xProp, yProp, onClick) {
  const additionalProps = _.without(_.keys(data.data.all), "x", yProp);
  const allProps = _.concat(["x", yProp], additionalProps);
  const builder = data =>
    _.map(_.range(_.size(data.all.x)), idx =>
      _.reduce(
        allProps,
        (res, prop) =>
          _.assignIn(res, {
            [prop === yProp ? "y" : prop]: data.all[prop][idx],
          }),
        {}
      )
    );
  const scatterCfg = chartUtils.createScatterCfg(data, { x: xProp, y: [yProp] }, builder);
  scatterCfg.options.plugins.tooltip.callbacks.title = tooltipItems =>
    _.map(additionalProps, p => `${p}: ${tooltipItems[0].raw[p]}`);
  delete scatterCfg.options.scales.x.ticks;
  delete scatterCfg.options.scales.y?.ticks;
  scatterCfg.options.onClick = onClick;
  scatterCfg.options.maintainAspectRatio = false;
  // eslint-disable-next-line new-cap
  const chart = chartUtils.createChart(ctx, scatterCfg);
  return chart;
}

const BASE_SCATTER_URL = "/dtale/scatter";

function buildScatterParams(selectedCols, index, props, state) {
  const params = { selectedCols, query: props.chartData.query };
  if (index !== undefined) {
    params.dateCol = state.selectedDate;
    params.index = index;
  }
  if (state.rolling) {
    params.rolling = state.rolling;
    params.window = state.window;
    params.minPeriods = state.minPeriods;
  }
  params.dummyCols = findDummyCols(selectedCols, state.dummyCols);
  const path = `${BASE_SCATTER_URL}/${props.dataId}`;
  const urlProps = ["selectedCols", "query", "index", "dateCol", "rolling", "window", "minPeriods", "dummyCols"];
  return buildURL(path, params, urlProps);
}

function findCols(chartData, columns) {
  let { col1, col2 } = chartData || {};
  if (_.isUndefined(col1)) {
    if (_.isUndefined(col2)) {
      [col1, col2] = _.take(columns, 2);
    } else {
      col1 = _.find(columns, c => c !== col2);
    }
  } else if (_.isUndefined(col2)) {
    col2 = _.find(columns, c => c !== col1);
  }
  return { col1, col2 };
}

export default {
  BASE_SCATTER_URL,
  BASE_CORRELATIONS_URL: "/dtale/correlations",
  BASE_CORRELATIONS_TS_URL: "/dtale/correlations-ts",
  buildState,
  colorScale,
  ppsScale,
  createScatter,
  percent,
  buildScatterParams,
  findCols,
  findDummyCols,
  buildGridLoadState,
};
