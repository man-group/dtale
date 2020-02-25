import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import { RemovableError } from "../../RemovableError";
import chartUtils from "../../chartUtils";
import { fetchJson } from "../../fetcher";
import { renderCodePopupAnchor } from "../CodePopup";

const BASE_DESCRIBE_URL = "/dtale/describe";

class Details extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      details: null,
    };
    this.loadDetails = this.loadDetails.bind(this);
    this.createBoxplot = this.createBoxplot.bind(this);
    this.renderUniques = this.renderUniques.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (this.props.selected !== prevProps.selected) {
      this.loadDetails();
    }
  }

  loadDetails() {
    fetchJson(`${BASE_DESCRIBE_URL}/${this.props.dataId}/${this.props.selected}`, detailData => {
      const newState = {
        error: null,
        details: null,
        code: null,
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
      newState.details.name = this.props.selected;
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
      this.renderUniques(),
    ];
  }
}
Details.displayName = "Details";
Details.propTypes = {
  selected: PropTypes.string,
  dataId: PropTypes.string,
  propagateState: PropTypes.func,
};

export { Details };
