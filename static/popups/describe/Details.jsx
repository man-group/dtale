import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import { Bouncer } from "../../Bouncer";
import { JSAnchor } from "../../JSAnchor";
import { RemovableError } from "../../RemovableError";
import { buildURLString, saveColFilterUrl } from "../../actions/url-utils";
import chartUtils from "../../chartUtils";
import { exports as gu } from "../../dtale/gridUtils";
import { fetchJson } from "../../fetcher";
import { buildButton } from "../../toggleUtils";
import { renderCodePopupAnchor } from "../CodePopup";

const BASE_DESCRIBE_URL = "/dtale/describe";

class Details extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      details: null,
      deepData: "uniques",
      outliers: null,
      loadingOutliers: false,
    };
    this.loadDetails = this.loadDetails.bind(this);
    this.createBoxplot = this.createBoxplot.bind(this);
    this.renderUniques = this.renderUniques.bind(this);
    this.renderDeepDataToggle = this.renderDeepDataToggle.bind(this);
    this.loadOutliers = this.loadOutliers.bind(this);
    this.renderOutliers = this.renderOutliers.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (!_.isEqual(this.props.selected, prevProps.selected)) {
      this.loadDetails();
    }
  }

  loadDetails() {
    fetchJson(`${BASE_DESCRIBE_URL}/${this.props.dataId}/${this.props.selected.name}`, detailData => {
      const newState = {
        error: null,
        details: null,
        code: null,
        outliers: null,
        deepData: "uniques",
      };
      if (detailData.error) {
        newState.error = (
          <div className="col-md-12">
            <RemovableError {...detailData} />
          </div>
        );
        this.setState(newState, () => this.createBoxplot);
        return;
      }
      newState.details = _.pick(detailData, ["describe", "uniques"]);
      newState.details.name = this.props.selected.name;
      newState.code = detailData.code;
      this.setState(newState, this.createBoxplot);
    });
  }

  createBoxplot() {
    const builder = ctx => {
      const { details } = this.state;
      const { describe, name } = details || {};
      const chartData = _(describe || {})
        .pickBy((v, k) => _.includes(["25%", "50%", "75%", "min", "max"], k) && !_.includes(["nan", "inf"], v))
        .mapKeys((_v, k) => _.get({ "25%": "q1", "50%": "median", "75%": "q3" }, k, k))
        .mapValues(v => parseFloat(_.replace(v, /,/g, "")))
        .value();
      if (_.size(chartData) == 0) {
        return null;
      }
      _.forEach(["min", "max"], p => {
        if (!_.isUndefined(chartData[p])) {
          chartData[`whisker${p}`] = chartData[p];
        }
      });
      if (!_.isUndefined(describe.mean) && !_.includes(["nan", "inf"], describe.mean)) {
        chartData.outliers = [parseFloat(_.replace(describe.mean, /,/g, ""))];
      }
      return chartUtils.createChart(ctx, {
        type: "boxplot",
        data: {
          labels: [name],
          datasets: [
            {
              label: name,
              backgroundColor: "rgba(54, 162, 235, 0.5)",
              borderColor: "rgb(54, 162, 235)",
              borderWidth: 1,
              data: [chartData],
            },
          ],
        },
        options: {
          responsive: true,
          legend: { display: false },
          title: { display: false },
          tooltips: { enabled: false },
          scales: {
            yAxes: [{ ticks: { min: chartData.min - 1, max: chartData.max + 1 } }],
          },
        },
      });
    };
    const chart = chartUtils.chartWrapper("boxplot", this.state.boxplot, builder);
    this.setState({ boxplot: chart });
  }

  renderUniques() {
    if (this.state.deepData == "outliers") {
      return null;
    }
    const uniques = _.get(this.state, "details.uniques") || {};
    if (_.isEmpty(uniques.data)) {
      return null;
    }
    return (
      <div key={3} className="row">
        <div className="col-sm-12">
          <span className="font-weight-bold" style={{ fontSize: "120%" }}>
            {`Unique Values${uniques.top ? " (top 100 most common)" : ""}:`}
          </span>
          <br />
          <span>{_.join(uniques.top ? uniques.data : _.sortBy(uniques.data), ", ")}</span>
        </div>
      </div>
    );
  }

  loadOutliers() {
    this.setState({ loadingOutliers: true });
    fetchJson(`/dtale/outliers/${this.props.dataId}/${this.props.selected.name}`, outlierData => {
      this.setState({ outliers: outlierData, loadingOutliers: false });
    });
  }

  renderDeepDataToggle() {
    if (_.includes(["float", "int"], gu.findColType(this.props.selected.dtype))) {
      const { deepData, outliers, loadingOutliers } = this.state;
      const toggle = val => () => {
        const outliersCallback = _.isNull(outliers) && !loadingOutliers ? this.loadOutliers : _.noop;
        this.setState({ deepData: val }, outliersCallback);
      };
      return (
        <div key="toggle" className="row pb-5">
          <div className="col-auto pl-0">
            <div className="btn-group compact col-auto">
              <button {...buildButton(deepData == "uniques", toggle("uniques"))}>Uniques</button>
              <button {...buildButton(deepData == "outliers", toggle("outliers"))}>Outliers</button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  renderOutliers() {
    if (this.state.deepData == "uniques") {
      return null;
    }
    if (this.state.loadingOutliers) {
      return <Bouncer key={3} />;
    }
    const { outliers } = this.state;
    const outlierValues = _.get(outliers, "outliers", []);
    if (_.isEmpty(outlierValues)) {
      return (
        <div key={3} className="row">
          <div className="col-sm-12">
            <span className="font-weight-bold" style={{ fontSize: "120%" }}>
              No Outliers Detected
            </span>
          </div>
        </div>
      );
    }
    const saveFilter = () => {
      const cfg = { type: "outliers" };
      if (!outliers.queryApplied) {
        cfg.query = outliers.query;
      }
      const url = buildURLString(saveColFilterUrl(this.props.dataId, this.props.selected.name), {
        cfg: JSON.stringify(cfg),
      });
      this.setState(
        {
          outliers: _.assignIn({}, outliers, {
            queryApplied: !outliers.queryApplied,
          }),
        },
        fetchJson(url, data => this.props.propagateState({ outlierFilters: data.currFilters || {} }))
      );
    };
    return [
      <div key={3} className="row">
        <div className="col">
          <span className="font-weight-bold" style={{ fontSize: "120%" }}>
            {`${_.size(outlierValues)} Outliers Found${outliers.top ? " (top 100)" : ""}:`}
          </span>
          <JSAnchor onClick={saveFilter} className="d-block">
            <span className="pr-3">{`${outliers.queryApplied ? "Remove" : "Apply"} outlier filter:`}</span>
            <span className="font-weight-bold">{outliers.query}</span>
          </JSAnchor>
        </div>
        <div className="col-auto">
          <div className="hoverable" style={{ borderBottom: "none" }}>
            <i className="ico-code pr-3" />
            <span>View Code</span>
            <div className="hoverable__content" style={{ width: "auto" }}>
              <pre className="mb-0">{outliers.code}</pre>
            </div>
          </div>
        </div>
      </div>,
      <div key={4} className="row">
        <div className="col-sm-12">
          <span>{_.join(_.sortBy(outlierValues), ", ")}</span>
        </div>
      </div>,
    ];
  }

  render() {
    if (this.state.error) {
      return (
        <div key={1} className="row">
          <div className="col-sm-12">{this.state.error}</div>
        </div>
      );
    }
    const { details } = this.state;
    if (_.isEmpty(details)) {
      return null;
    }

    return [
      <div key={1} className="row">
        <div className="col-auto">
          <h1>{details.name}</h1>
          <span className="pl-3">({this.props.selected.dtype})</span>
        </div>
        <div className="col text-right">{renderCodePopupAnchor(this.state.code, "Describe")}</div>
      </div>,
      <div key={2} className="row">
        <div className="col-md-6">
          <ul>
            {_.map(_.get(details, "describe", {}), (v, k) => (
              <li key={k}>
                <div>
                  <h4 className="d-inline pr-5">{`${k}:`}</h4>
                  <span className="d-inline">{v}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="col-md-6">
          <div style={{ height: 300 }}>
            <canvas id="boxplot" />
          </div>
        </div>
      </div>,
      this.renderDeepDataToggle(),
      this.renderUniques(),
      this.renderOutliers(),
    ];
  }
}
Details.displayName = "Details";
Details.propTypes = {
  selected: PropTypes.object,
  dataId: PropTypes.string,
  propagateState: PropTypes.func,
};

export { Details };
