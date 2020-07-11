import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import chartUtils from "../../chartUtils";

class DetailsBoxplot extends React.Component {
  constructor(props) {
    super(props);
    this.state = { boxplot: null };
    this.createBoxplot = this.createBoxplot.bind(this);
  }
  componentDidMount() {
    this.createBoxplot();
  }

  shouldComponentUpdate(newProps) {
    return !_.isEqual(this.props.details, newProps.details);
  }

  componentDidUpdate() {
    this.createBoxplot();
  }

  createBoxplot() {
    const builder = ctx => {
      const { details } = this.props;
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

  render() {
    const { details } = this.props;
    return (
      <div className="row">
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
      </div>
    );
  }
}
DetailsBoxplot.displayName = "DetailsBoxplot";
DetailsBoxplot.propTypes = {
  details: PropTypes.object,
};

export default DetailsBoxplot;
