import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import chartUtils from "../../chartUtils";
import { DetailsSequentialDiffs } from "./DetailsSequentialDiffs";
import { buildStat, COUNT_STATS, POSITION_STATS } from "./detailUtils";

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
      let chartData = _.pickBy(
        describe || {},
        (v, k) => _.includes(["25%", "50%", "75%", "min", "max"], k) && !_.includes(["nan", "inf"], v)
      );
      chartData = _.mapKeys(chartData, (_v, k) => _.get({ "25%": "q1", "50%": "median", "75%": "q3" }, k, k));
      chartData = _.mapValues(chartData, v => parseFloat(_.replace(v, /,/g, "")));
      if (_.size(chartData) == 0) {
        return null;
      }
      _.forEach(["min", "max"], p => {
        if (!_.isUndefined(chartData[p])) {
          chartData[`whisker${_.capitalize(p)}`] = chartData[p];
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
          maintainAspectRatio: false,
          legend: { display: false },
          title: { display: false },
          plugins: {
            tooltip: {
              enabled: true,
              callbacks: {
                label: context => [
                  `Min: ${context.raw.min}`,
                  `Q1: ${context.raw.q1}`,
                  `Median: ${context.raw.median}`,
                  `Q3: ${context.raw.q3}`,
                  `Max: ${context.raw.max}`,
                ],
              },
            },
          },
          scales: {
            y: { ticks: { min: chartData.min - 1, max: chartData.max + 1 } },
          },
        },
      });
    };
    const chart = chartUtils.chartWrapper("boxplot", this.state.boxplot, builder);
    this.setState({ boxplot: chart });
  }

  render() {
    const { details, column, t } = this.props;
    const describe = _.get(details, "describe", {});
    const describeKeys = _.keys(
      _.omit(describe, _.concat(["total_count", "freq", "skew", "kurt"], COUNT_STATS, POSITION_STATS))
    );
    let dtypeCounts = null;
    if (details.dtype_counts) {
      dtypeCounts = (
        <li>
          <h4 className="mb-0">{t("Dtype Counts")}</h4>
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
              {buildStat(t, "total_count", describe.total_count)}
              <ul>
                {_.map(COUNT_STATS, stat => (
                  <li key={stat}>{buildStat(t, stat, describe[stat])}</li>
                ))}
              </ul>
            </li>
            {_.map(POSITION_STATS, k => describe[k] !== undefined && <li key={k}>{buildStat(t, k, describe[k])}</li>)}
            {describe.freq !== undefined && (
              <ul>
                <li>{buildStat(t, "freq", describe.freq)}</li>
              </ul>
            )}
            {_.map(describeKeys, k => (
              <li key={k}>{buildStat(t, k, describe[k])}</li>
            ))}
            {details.string_metrics && (
              <React.Fragment>
                <li>
                  <div>
                    <h4 className="d-inline">Characters</h4>
                  </div>
                  <ul>
                    <li>{buildStat(t, "Min # Chars", details.string_metrics.char_min)}</li>
                    <li>{buildStat(t, "Average # Chars", details.string_metrics.char_mean)}</li>
                    <li>{buildStat(t, "Max # Chars", details.string_metrics.char_max)}</li>
                    <li>{buildStat(t, "STD # Chars", details.string_metrics.char_std)}</li>
                    <li>{buildStat(t, "Rows w/ Spaces", details.string_metrics.with_space)}</li>
                    <li>{buildStat(t, "Rows w/ Accent Chars", details.string_metrics.with_accent)}</li>
                    <li>{buildStat(t, "Rows w/ Numeric Chars", details.string_metrics.with_num)}</li>
                    <li>{buildStat(t, "Rows w/ Uppercase Chars", details.string_metrics.with_upper)}</li>
                    <li>{buildStat(t, "Rows w/ Lowercase Chars", details.string_metrics.with_lower)}</li>
                    <li>{buildStat(t, "Rows w/ Punctuation", details.string_metrics.with_punc)}</li>
                    <li>{buildStat(t, "Rows Starting w/ Space", details.string_metrics.space_at_the_first)}</li>
                    <li>{buildStat(t, "Rows Ending w/ Space", details.string_metrics.space_at_the_end)}</li>
                    <li>
                      {buildStat(t, "Rows w/ Multi Spacing", details.string_metrics.multi_space_after_each_other)}
                    </li>
                    <li>{buildStat(t, "Rows w/ Hidden Chars", details.string_metrics.with_hidden)}</li>
                  </ul>
                </li>
                <li>
                  <div>
                    <h4 className="d-inline">{t("Words")}</h4>
                  </div>
                  <ul>
                    <li>{buildStat(t, "Min # Words", details.string_metrics.word_min)}</li>
                    <li>{buildStat(t, "Average # Words", details.string_metrics.word_mean)}</li>
                    <li>{buildStat(t, "Max # Words", details.string_metrics.word_max)}</li>
                    <li>{buildStat(t, "STD # Words", details.string_metrics.word_std)}</li>
                  </ul>
                </li>
              </React.Fragment>
            )}
            {details.sequential_diffs && <DetailsSequentialDiffs data={details.sequential_diffs} column={column} />}
            {describe.kurt !== undefined && <li>{buildStat(t, "kurt", describe.kurt)}</li>}
            {describe.skew !== undefined && <li>{buildStat(t, "skew", describe.skew)}</li>}
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
  column: PropTypes.string,
  t: PropTypes.func,
};

export default withTranslation("describe")(DetailsBoxplot);
