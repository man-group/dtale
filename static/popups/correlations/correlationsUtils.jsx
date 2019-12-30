import chroma from "chroma-js";
import _ from "lodash";

import chartUtils from "../../chartUtils";

const colorScale = chroma.scale(["red", "yellow", "green"]).domain([-1, 0, 1]);
const percent = num => (num === "N/A" ? num : `${_.round(num * 100, 2)}%`);

function createScatter(ctx, data, xProp, yProp, onClick) {
  const builder = data =>
    _.map(_.zip(data.all.x, data.all[yProp], data.all.index), ([xVal, yVal, index]) => ({ x: xVal, y: yVal, index }));
  const scatterCfg = chartUtils.createScatterCfg(data, { x: xProp, y: [yProp] }, builder);
  scatterCfg.options.tooltips.callbacks.title = (tooltipItems, data) => [
    [`Index: ${data.datasets[tooltipItems[0].datasetIndex].data[tooltipItems[0].index].index}`],
  ];
  delete scatterCfg.options.scales.xAxes[0].ticks;
  delete scatterCfg.options.scales.yAxes[0].ticks;
  scatterCfg.options.onClick = onClick;
  // eslint-disable-next-line new-cap
  const chart = chartUtils.createChart(ctx, scatterCfg);
  return chart;
}

export default {
  colorScale,
  createScatter,
  percent,
};
