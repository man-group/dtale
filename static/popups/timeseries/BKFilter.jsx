import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import chartUtils from "../../chartUtils";
import { validate as validateBase, buildCode as buildBaseCode } from "./BaseInputs";

export function validate(cfg) {
  const error = validateBase(cfg);
  if (error) {
    return error;
  }
  const { low, high, K } = cfg;
  if (!low) {
    return "Please enter a low!";
  }
  if (!high) {
    return "Please enter a high!";
  }
  if (!K) {
    return "Please enter K!";
  }
  return null;
}

export function buildCode({ index, col, agg, low, high, K }) {
  if (!index) {
    return null;
  }
  if (!col) {
    return null;
  }
  return [
    "from statsmodels.tsa.filters.bk_filter import bkfilter",
    "",
    buildBaseCode(index, col, agg),
    `cycle = bkfilter(s, ${low}, ${high}, ${K})`,
  ];
}

export const CHART_COLS = ["cycle"];

export function chartConfig(config, chartConfig) {
  chartUtils.COLOR_PROPS.forEach(prop => {
    chartConfig.data.datasets[0][prop] = chartUtils.TS_COLORS[0];
    chartConfig.data.datasets[1][prop] = chartUtils.TS_COLORS[1];
  });
  chartConfig.options.scales[`y-${config.col}`].position = "left";
  chartConfig.options.scales["y-cycle"].position = "right";
  chartConfig.options.scales.x.title.display = false;
  chartConfig.options.plugins.legend = { display: true };
  return chartConfig;
}

export class ReactBKFilter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      low: props.cfg?.low ?? 6,
      high: props.cfg?.high ?? 32,
      K: props.cfg?.K ?? 12,
    };
    this.updateState = this.updateState.bind(this);
  }

  componentDidMount() {
    this.updateState(this.state);
  }

  componentDidUpdate(prevProps) {
    if (!_.isEqual(this.props.baseCfg, prevProps.baseCfg)) {
      this.updateState(this.state);
    }
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const cfg = _.pick(currState, ["low", "high", "K"]);
    this.setState(currState, () => this.props.updateState({ cfg }));
  }

  render() {
    const { t } = this.props;
    return (
      <>
        {["low", "high", "K"].map(field => (
          <div key={field} className="col-md-4">
            <div className="form-group row">
              <label className="col-md-3 col-form-label text-right">
                {t(_.capitalize(field), { ns: "timeseries" })}
              </label>
              <div className="col-md-8">
                <div className="hoverable">
                  <input
                    type="number"
                    className="form-control"
                    value={this.state[field]}
                    onChange={e => this.setState({ [field]: e.target.value })}
                    onKeyDown={e => {
                      if (e.key === "Enter" && this.state[field]) {
                        this.updateState({});
                      }
                    }}
                  />
                  <div className="hoverable__content edit-cell">{t(`${field}_desc`, { ns: "timeseries" })}</div>
                </div>
                <small>(Press ENTER to submit)</small>
              </div>
            </div>
          </div>
        ))}
      </>
    );
  }
}
ReactBKFilter.displayName = "ReactBKFilter";
ReactBKFilter.propTypes = {
  updateState: PropTypes.func,
  t: PropTypes.func,
  baseCfg: PropTypes.object,
  cfg: PropTypes.object,
};
export const BKFilter = withTranslation(["timeseries", "constants"])(ReactBKFilter);
