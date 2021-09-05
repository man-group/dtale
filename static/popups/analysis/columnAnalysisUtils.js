/* eslint max-statements: "off" */
import _ from "lodash";
import $ from "jquery";
import qs from "querystring";
import React from "react";

import chartUtils from "../../chartUtils";
import { buildURLParams } from "../../actions/url-utils";
import { fetchJson } from "../../fetcher";
import { RemovableError } from "../../RemovableError";
import ColumnAnalysisChart from "./ColumnAnalysisChart";
import { Bouncer } from "../../Bouncer";
import { kurtMsg, skewMsg } from "../../dtale/column/ColumnMenuHeader";

const DESC_PROPS = ["count", "mean", "std", "min", "25%", "50%", "75%", "max", "skew", "kurt"];
const Tableau20 = _.concat(
  ["#4E79A7", "#A0CBE8", "#F28E2B", "#FFBE7D", "#59A14F", "#8CD17D", "#B6992D"],
  ["#F1CE63", "#499894", "#86BCB6", "#E15759", "#FF9D9A", "#79706E", "#BAB0AC"],
  ["#D37295", "#FABFD2", "#B07AA1", "#D4A6C8", "#9D7660", "#D7B5A6"]
);

function buildValueCountsAxes(baseCfg, fetchedData, chartOpts) {
  const xAxes = { scaleLabel: { display: true, labelString: "Value" } };
  const { data, ordinal } = fetchedData;
  let datasets = [{ label: "Frequency", type: "bar", data, backgroundColor: "rgb(42, 145, 209)", yAxisID: "y" }];
  const yAxes = {
    y: { scaleLabel: { display: true, labelString: "Frequency" }, position: "left" },
  };
  if (_.has(fetchedData, "ordinal")) {
    const ordinalCol = _.get(chartOpts, "ordinalCol.value");
    const ordinalAgg = _.get(chartOpts, "ordinalAgg.value");
    yAxes["y-2"] = {
      scaleLabel: { display: true, labelString: `${ordinalCol} (${ordinalAgg})` },
      position: "right",
    };
    datasets = _.concat(
      _.assignIn(
        { label: `${ordinalCol} (${ordinalAgg})`, type: "line", fill: false, borderColor: "rgb(255, 99, 132)" },
        { borderWidth: 2, data: ordinal, backgroundColor: "rgb(255, 99, 132)", yAxisID: "y-2" },
        { tension: 0.4, pointRadius: 0 }
      ),
      datasets
    );
    baseCfg.options.plugins = { ...baseCfg.options.plugins, tooltip: { mode: "index", intersect: true } };
  }
  baseCfg.data.datasets = datasets;
  baseCfg.options.scales = { x: xAxes, ...yAxes };
  baseCfg.options.scales.y.ticks = { min: 0 };
}

function buildCategoryAxes(baseCfg, fetchedData, chartOpts) {
  const { data, count } = fetchedData;
  const xAxes = { scaleLabel: { display: true, labelString: _.get(chartOpts, "categoryCol.value") } };
  const yLabel = `${chartOpts.selectedCol} (${_.get(chartOpts, "categoryAgg.label")})`;
  const yAxes = {
    y: { scaleLabel: { display: true, labelString: yLabel }, position: "left" },
    "y-2": { scaleLabel: { display: true, labelString: "Frequency" }, position: "right" },
  };
  const datasets = [
    _.assignIn(
      { label: "Frequency", type: "line", fill: false, borderColor: "rgb(255, 99, 132)", borderWidth: 2 },
      { data: count, backgroundColor: "rgb(255, 99, 132)", yAxisID: "y-2", tension: 0.4 }
    ),
    { type: "bar", data, backgroundColor: "rgb(42, 145, 209)", yAxisID: "y", label: yLabel },
  ];
  baseCfg.data.datasets = datasets;
  baseCfg.options.scales = { x: xAxes, ...yAxes };
  baseCfg.options.scales["y-2"].ticks = { min: 0 };
  baseCfg.options.plugins = { ...baseCfg.options.plugins, tooltip: { mode: "index", intersect: true } };
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) };
  }
  return null;
}

function targetColor(idx) {
  const color = hexToRgb(Tableau20[idx % 20]);
  return `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`;
}

function buildHistogramAxes(baseCfg, fetchedData, chartOpts) {
  const { data, targets, kde } = fetchedData;
  const xAxes = { x: { scaleLabel: { display: true, labelString: "Bin" } } };
  const yAxes = {
    y: { scaleLabel: { display: true, labelString: "Frequency" } },
  };
  let datasets = [];
  if (targets) {
    xAxes.x = { ...xAxes.x, stacked: true };
    yAxes.y.stacked = false;
    yAxes.y.ticks = { beginAtZero: true };
    datasets = _.map(targets, (targetData, idx) => ({
      label: targetData.target,
      data: targetData.data,
      stacked: true,
      categoryPercentage: 1.0,
      barPercentage: 1.0,
      backgroundColor: targetColor(idx),
    }));
  } else {
    datasets.push({ label: "Frequency", type: "bar", data: data, backgroundColor: "rgb(42, 145, 209)", yAxisID: "y" });
    if (kde) {
      yAxes.y.position = "left";
      yAxes["y-2"] = {
        scaleLabel: { display: true, labelString: "KDE" },
        position: "right",
        ticks: { min: 0, max: _.max(kde) },
      };
      datasets = _.concat(
        _.assignIn(
          { label: "KDE", type: "line", fill: false, borderColor: "rgb(255, 99, 132)", tension: 0.4 },
          { borderWidth: 2, data: kde, backgroundColor: "rgb(255, 99, 132)", pointRadius: 0, yAxisID: "y-2" }
        ),
        datasets
      );
    }
  }
  baseCfg.data.datasets = datasets;
  baseCfg.options.scales = { ...xAxes, ...yAxes };
  baseCfg.options.scales.y.ticks = { min: 0 };
  const tooltip = {
    mode: "index",
    intersect: false,
    callbacks: {
      title: tooltipItems => `${chartOpts.selectedCol} ${tooltipItems[0].label}`,
      beforeBody: () => _.get(chartOpts.target, "value"),
    },
    itemSort: (a, b) => b.raw - a.raw,
  };
  baseCfg.options.plugins = { ...baseCfg.options.plugins, legend: { display: true }, tooltip };
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
const emptyVal = val => (
  <div style={{ height: 400 }} className="missing-category">
    {`Please select a ${val}.`}
  </div>
);

const PARAM_PROPS = _.concat(
  ["selectedCol", "bins", "top", "type", "ordinalCol", "ordinalAgg", "categoryCol"],
  ["categoryAgg", "cleaners", "latCol", "lonCol", "target", "filtered"]
);

const isPlotly = type => _.includes(["geolocation", "qq"], type);

function dataLoader(props, state, propagateState, chartParams) {
  const { chartData, height, dataId } = props;
  const finalParams = chartParams || state.chartParams;
  const { selectedCol } = chartData;
  const params = _.assignIn({}, chartData, _.pick(finalParams, ["bins", "top"]));
  params.type = _.get(finalParams, "type");
  params.filtered = props.filtered ?? true;
  if (isPlotly(params.type) || finalParams?.target) {
    state.chartRef?.current?.state?.chart?.destroy?.();
    propagateState({ chart: <Bouncer /> });
  }
  if (params.type === "categories" && _.isNull(finalParams.categoryCol)) {
    propagateState({ chart: emptyVal("category"), code: null });
    return;
  }
  let subProps = ["categoryCol", "categoryAgg"];
  if (params.type === "geolocation") {
    if (_.isNull(finalParams.latCol) || _.isNull(finalParams.lonCol)) {
      propagateState({ chart: emptyVal(_.isNull(finalParams.latCol) ? "latitude" : "longitude"), code: null });
      return;
    } else {
      subProps = ["latCol", "lonCol"];
    }
  } else if (_.includes(["value_counts", "word_value_counts"], params.type)) {
    subProps = ["ordinalCol", "ordinalAgg"];
  } else if (params.type === "histogram") {
    subProps = ["target"];
  } else if (params.type === "qq") {
    subProps = [];
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
      propagateState({ error: <RemovableError {...fetchedChartData} /> });
      return;
    }
    newState.code = _.get(fetchedChartData, "code", "");
    newState.dtype = _.get(fetchedChartData, "dtype", "");
    newState.type = _.get(fetchedChartData, "chart_type", "histogram");
    newState.query = _.get(fetchedChartData, "query");
    newState.cols = _.get(fetchedChartData, "cols", []);
    newState.top = _.get(fetchedChartData, "top", null);
    let wordValues;
    if (newState.type === "word_value_counts") {
      wordValues = _.zipWith(fetchedChartData.labels, fetchedChartData.data, (value, count) => ({ value, count }));
    }
    newState.chart = (
      <ColumnAnalysisChart
        ref={state.chartRef}
        finalParams={_.assignIn(finalParams, { selectedCol, type: newState.type })}
        fetchedChartData={fetchedChartData}
        height={height}
      />
    );
    propagateState({ ...newState, wordValues });
  });
}

export { createChart, dataLoader, isPlotly };
