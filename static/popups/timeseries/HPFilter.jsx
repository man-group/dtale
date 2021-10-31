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
  if (!cfg.lamb) {
    return "Please enter a lambda!";
  }
  return null;
}

export function buildCode({ index, col, agg, lamb }) {
  if (!index) {
    return null;
  }
  if (!col) {
    return null;
  }
  return [
    "from statsmodels.tsa.filters.hp_filter import hpfilter",
    "",
    buildBaseCode(index, col, agg),
    `cycle, trend = hpfilter(s, lamb=${lamb})`,
  ];
}

export const CHART_COLS = ["cycle", "trend"];

export function chartConfig(config, chartConfig) {
  const { col } = config;
  chartUtils.COLOR_PROPS.forEach(prop => {
    chartConfig.data.datasets[0][prop] = chartUtils.TS_COLORS[0];
    chartConfig.data.datasets[1][prop] = chartUtils.TS_COLORS[1];
    chartConfig.data.datasets[2][prop] = chartUtils.TS_COLORS[2];
  });
  chartConfig.data.datasets[1].yAxisID = `y-${col}`;
  chartConfig.options.scales[`y-${col}`].position = "left";
  chartConfig.options.scales[`y-${col}`].title.text = `${col}, trend`;
  chartConfig.options.scales["y-cycle"].position = "right";
  chartConfig.options.scales["y-trend"].display = false;
  chartConfig.options.scales.x.title.display = false;
  chartConfig.options.plugins.legend = { display: true };
  return chartConfig;
}

export class ReactHPFilter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lamb: props.cfg?.lamb ?? 1600,
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
    this.setState(currState, () => this.props.updateState({ cfg: currState }));
  }

  render() {
    const { t } = this.props;
    return (
      <div className="col-md-4">
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">{t("timeseries:Lambda")}</label>
          <div className="col-md-8">
            <div className="hoverable">
              <input
                type="number"
                className="form-control"
                value={this.state.lamb}
                onChange={e => this.setState({ lamb: e.target.value })}
                onKeyDown={e => {
                  if (e.key === "Enter" && this.state.lamb) {
                    this.updateState({});
                  }
                }}
              />
              <div className="hoverable__content edit-cell">{t("lamb_desc", { ns: "timeseries" })}</div>
            </div>
            <small>(Press ENTER to submit)</small>
          </div>
        </div>
      </div>
    );
  }
}
ReactHPFilter.displayName = "ReactHPFilter";
ReactHPFilter.propTypes = {
  updateState: PropTypes.func,
  t: PropTypes.func,
  cfg: PropTypes.object,
  baseCfg: PropTypes.object,
};
export const HPFilter = withTranslation(["timeseries", "constants"])(ReactHPFilter);
