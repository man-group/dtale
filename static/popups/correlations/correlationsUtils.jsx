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
  };
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
  scatterCfg.options.tooltips.callbacks.title = (tooltipItems, data) =>
    _.map(additionalProps, p => {
      const val = data.datasets[tooltipItems[0].datasetIndex].data[tooltipItems[0].index][p];
      return `${p}: ${val}`;
    });
  delete scatterCfg.options.scales.xAxes[0].ticks;
  delete scatterCfg.options.scales.yAxes[0].ticks;
  scatterCfg.options.onClick = onClick;
  scatterCfg.options.maintainAspectRatio = false;
  // eslint-disable-next-line new-cap
  const chart = chartUtils.createChart(ctx, scatterCfg);
  return chart;
}

const BASE_SCATTER_URL = "/dtale/scatter";

function buildScatterParams(selectedCols, date, props, state) {
  const params = { selectedCols, query: props.chartData.query };
  if (date) {
    params.dateCol = state.selectedDate;
    params.date = date;
  }
  if (state.rolling) {
    params.rolling = state.rolling;
    params.window = state.window;
  }
  const path = `${BASE_SCATTER_URL}/${props.dataId}`;
  return buildURL(path, params, ["selectedCols", "query", "date", "dateCol", "rolling", "window"]);
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
};
