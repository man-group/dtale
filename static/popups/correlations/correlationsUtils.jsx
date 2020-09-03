import chroma from "chroma-js";
import _ from "lodash";

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
  };
}

const colorScale = chroma.scale(["red", "yellow", "green"]).domain([-1, 0, 1]);
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

export default {
  BASE_SCATTER_URL: "/dtale/scatter",
  BASE_CORRELATIONS_URL: "/dtale/correlations",
  BASE_CORRELATIONS_TS_URL: "/dtale/correlations-ts",
  buildState,
  colorScale,
  createScatter,
  percent,
};
