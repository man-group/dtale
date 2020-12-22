import _ from "lodash";
import $ from "jquery";
import chartUtils from "../../chartUtils";
import qs from "querystring";
import { buildURLParams } from "../../actions/url-utils";
import { fetchJson } from "../../fetcher";
import { RemovableError } from "../../RemovableError";
import ColumnAnalysisChart from "./ColumnAnalysisChart";
import React from "react";
import { kurtMsg, skewMsg } from "../../dtale/column/ColumnMenuHeader";

const DESC_PROPS = ["count", "mean", "std", "min", "25%", "50%", "75%", "max", "skew", "kurt"];

function buildValueCountsAxes(baseCfg, fetchedData, chartOpts) {
  const xAxes = [{ scaleLabel: { display: true, labelString: "Value" } }];
  const { data, ordinal } = fetchedData;
  let datasets = [{ label: "Frequency", type: "bar", data, backgroundColor: "rgb(42, 145, 209)", yAxisID: "y-1" }];
  const yAxes = [{ scaleLabel: { display: true, labelString: "Frequency" }, position: "left", id: "y-1" }];
  if (_.has(fetchedData, "ordinal")) {
    const ordinalCol = _.get(chartOpts, "ordinalCol.value");
    const ordinalAgg = _.get(chartOpts, "ordinalAgg.value");
    yAxes.push({
      scaleLabel: { display: true, labelString: `${ordinalCol} (${ordinalAgg})` },
      id: "y-2",
      position: "right",
    });
    datasets = _.concat(
      _.assignIn(
        { label: `${ordinalCol} (${ordinalAgg})`, type: "line", fill: false, borderColor: "rgb(255, 99, 132)" },
        { borderWidth: 2, data: ordinal, backgroundColor: "rgb(255, 99, 132)", yAxisID: "y-2" }
      ),
      datasets
    );
    baseCfg.options.tooltips = { mode: "index", intersect: true };
  }
  baseCfg.data.datasets = datasets;
  baseCfg.options.scales = { xAxes, yAxes };
  baseCfg.options.scales.yAxes[0].ticks = { min: 0 };
}

function buildCategoryAxes(baseCfg, fetchedData, chartOpts) {
  const { data, count } = fetchedData;
  const xAxes = [{ scaleLabel: { display: true, labelString: _.get(chartOpts, "categoryCol.value") } }];
  const yLabel = `${chartOpts.selectedCol} (${_.get(chartOpts, "categoryAgg.label")})`;
  const yAxes = [
    { scaleLabel: { display: true, labelString: yLabel }, id: "y-1", position: "left" },
    { scaleLabel: { display: true, labelString: "Frequency" }, id: "y-2", position: "right" },
  ];
  const datasets = [
    _.assignIn(
      { label: "Frequency", type: "line", fill: false, borderColor: "rgb(255, 99, 132)", borderWidth: 2 },
      { data: count, backgroundColor: "rgb(255, 99, 132)", yAxisID: "y-2" }
    ),
    { type: "bar", data, backgroundColor: "rgb(42, 145, 209)", yAxisID: "y-1", label: yLabel },
  ];
  baseCfg.data.datasets = datasets;
  baseCfg.options.scales = { xAxes, yAxes };
  baseCfg.options.scales.yAxes[0].ticks = { min: 0 };
  baseCfg.options.tooltips = { mode: "index", intersect: true };
}

function buildHistogramAxes(baseCfg, fetchedData, _chartOpts) {
  const { data, kde } = fetchedData;
  const xAxes = [{ scaleLabel: { display: true, labelString: "Bin" } }];
  const yAxes = [{ scaleLabel: { display: true, labelString: "Frequency" }, position: "left", id: "y-1" }];
  let datasets = [
    { label: "Frequency", type: "bar", data: data, backgroundColor: "rgb(42, 145, 209)", yAxisID: "y-1" },
  ];
  if (kde) {
    yAxes.push({
      scaleLabel: { display: true, labelString: "KDE" },
      id: "y-2",
      position: "right",
    });
    datasets = _.concat(
      _.assignIn(
        { label: "KDE", type: "line", fill: false, borderColor: "rgb(255, 99, 132)" },
        { borderWidth: 2, data: kde, backgroundColor: "rgb(255, 99, 132)", pointRadius: 0, yAxisID: "y-2" }
      ),
      datasets
    );
    baseCfg.options.tooltips = { mode: "index", intersect: true };
  }
  baseCfg.data.datasets = datasets;
  baseCfg.options.scales = { xAxes, yAxes };
  baseCfg.options.scales.yAxes[0].ticks = { min: 0 };
  baseCfg.options.tooltips = { mode: "index", intersect: false };
  baseCfg.options.legend.display = true;
}

function createChart(ctx, fetchedData, chartOpts) {
  const { desc, labels } = fetchedData;
  if (desc) {
    const descHTML = _.map(DESC_PROPS, p => {
      let markup = `${p === "kurt" ? "Kurtosis" : _.capitalize(p)}: <b>${desc[p]}</b>`;
      if (p === "skew") {
        markup += skewMsg(desc[p], true);
      }
      if (p === "kurt") {
        markup += kurtMsg(desc[p], true);
      }
      return markup;
    }).join(", ");
    $("#describe").html(`<small>${descHTML}</small>`);
  } else {
    $("#describe").empty();
  }
  const chartCfg = {
    type: "bar",
    data: { labels },
    options: {
      legend: { display: false },
    },
  };
  let infoBuilder = _.noop;
  switch (chartOpts.type) {
    case "histogram":
      infoBuilder = buildHistogramAxes;
      break;
    case "value_counts":
    case "word_value_counts":
      infoBuilder = buildValueCountsAxes;
      break;
    case "categories":
      infoBuilder = buildCategoryAxes;
      break;
  }
  infoBuilder(chartCfg, fetchedData, chartOpts);
  return chartUtils.createChart(ctx, chartCfg);
}

const BASE_ANALYSIS_URL = "/dtale/column-analysis";
const EMTPY_CATEGORY = (
  <div style={{ height: 400 }} className="missing-category">
    {"Please select a category."}
  </div>
);

const PARAM_PROPS = _.concat(
  ["selectedCol", "bins", "top", "type", "ordinalCol", "ordinalAgg", "categoryCol"],
  ["categoryAgg", "cleaners"]
);

function dataLoader(props, state, propagateState, chartParams) {
  const { chartData, height, dataId } = props;
  const finalParams = chartParams || state.chartParams;
  const { selectedCol } = chartData;
  const params = _.assignIn({}, chartData, _.pick(finalParams, ["bins", "top"]));
  params.type = _.get(finalParams, "type");
  if (params.type === "categories" && _.isNull(finalParams.categoryCol)) {
    propagateState({ chart: EMTPY_CATEGORY, code: null });
    return;
  }
  let subProps = ["categoryCol", "categoryAgg"];
  if (_.includes(["value_counts", "word_value_counts"], params.type)) {
    subProps = ["ordinalCol", "ordinalAgg"];
  }
  if (finalParams?.cleaners && finalParams?.cleaners?.length) {
    params.cleaners = _.join(_.map(finalParams.cleaners, "value"), ",");
  }
  _.forEach(subProps, p => (params[p] = _.get(finalParams, [p, "value"])));
  const url = `${BASE_ANALYSIS_URL}/${dataId}?${qs.stringify(buildURLParams(params, PARAM_PROPS))}`;
  fetchJson(url, fetchedChartData => {
    const newState = { error: null, chartParams: finalParams };
    if (_.get(fetchedChartData, "error")) {
      newState.error = <RemovableError {...fetchedChartData} />;
    }
    newState.code = _.get(fetchedChartData, "code", "");
    newState.dtype = _.get(fetchedChartData, "dtype", "");
    newState.type = _.get(fetchedChartData, "chart_type", "histogram");
    newState.query = _.get(fetchedChartData, "query");
    newState.cols = _.get(fetchedChartData, "cols", []);
    newState.top = _.get(fetchedChartData, "top", null);
    newState.chart = (
      <ColumnAnalysisChart
        finalParams={_.assignIn(finalParams, { selectedCol, type: newState.type })}
        fetchedChartData={fetchedChartData}
        height={height}
      />
    );
    propagateState(newState);
  });
}

export { createChart, dataLoader };
