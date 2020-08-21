import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import chartUtils from "../../chartUtils";

const COUNT_STATS = ["count", "missing_ct", "missing_pct"];
const LABELS = {
  total_count: "Total Rows",
  count: "Count (non-nan)",
  missing_ct: "Count (missing)",
  missing_pct: "% Missing",
  freq: "Frequency",
};

function buildStat(key, value) {
  if (value !== undefined) {
    return (
      <div>
        <h4 className="d-inline pr-5">{`${_.get(LABELS, key, key)}:`}</h4>
        <span className="d-inline">{value}</span>
      </div>
    );
  }
  return null;
}

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
    const describe = _.get(details, "describe", {});
    const describeKeys = _.keys(_.omit(describe, _.concat(["total_count"], COUNT_STATS)));
    let dtypeCounts = null;
    if (details.dtype_counts) {
      dtypeCounts = (
        <li>
          <h4 className="mb-0">Dtype Counts</h4>
          <ul>
            {_.map(details.dtype_counts, ({ count, dtype }) => (
              <li key={dtype}>
                {dtype}: {count}
              </li>
            ))}
          </ul>
        </li>
      );
    }
    return (
      <div className="row">
        <div className="col-md-6">
          <ul>
            <li>
              {buildStat("total_count", describe.total_count)}
              <ul>
                {_.map(COUNT_STATS, stat => (
                  <li key={stat}>{buildStat(stat, describe[stat])}</li>
                ))}
              </ul>
            </li>
            {_.map(describeKeys, k => (
              <li key={k}>{buildStat(k, describe[k])}</li>
            ))}
            {dtypeCounts}
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
