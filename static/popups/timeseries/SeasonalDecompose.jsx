import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import chartUtils from "../../chartUtils";
import { buildCode as buildBaseCode, validate as validateBase } from "./BaseInputs";

export function validate(cfg) {
  return validateBase(cfg);
}

export function buildCode(type, { index, col, agg, model }) {
  if (!index) {
    return null;
  }
  if (!col) {
    return null;
  }
  const code = [];
  if (type === "seasonal_decompose") {
    code.push("from statsmodels.tsa.seasonal import seasonal_decompose");
  } else {
    code.push("from statsmodels.tsa.seasonal import STL");
  }
  code.push("");
  code.push(buildBaseCode(index, col, agg));
  if (type === "seasonal_decompose") {
    code.push(`sd_result = seasonal_decompose(s, model='${model}')`);
  } else {
    code.push("stl_result = STL(s).fit()");
  }
  return code;
}

export const CHART_COLS = ["trend", "seasonal", "resid"];

export function chartConfig(config, chartConfig) {
  const { col } = config;
  chartUtils.COLOR_PROPS.forEach(prop => {
    chartConfig.data.datasets[0][prop] = chartUtils.TS_COLORS[0];
    chartConfig.data.datasets[1][prop] = chartUtils.TS_COLORS[1];
    chartConfig.data.datasets[2][prop] = chartUtils.TS_COLORS[2];
    chartConfig.data.datasets[3][prop] = chartUtils.TS_COLORS[3];
  });
  chartConfig.data.datasets[1].yAxisID = `y-${col}`;
  chartConfig.data.datasets[3].yAxisID = "y-seasonal";
  chartConfig.options.scales[`y-${col}`].position = "left";
  chartConfig.options.scales[`y-${col}`].title.text = `${col}, trend`;
  chartConfig.options.scales["y-seasonal"].position = "right";
  chartConfig.options.scales["y-seasonal"].title.text = `seasonal, resid`;
  chartConfig.options.scales["y-trend"].display = false;
  chartConfig.options.scales["y-resid"].display = false;
  chartConfig.options.scales.x.title.display = false;
  chartConfig.options.plugins.legend = { display: true };
  return chartConfig;
}

export class ReactSeasonalDecompose extends React.Component {
  constructor(props) {
    super(props);
    this.state = { model: "additive" };
    this.updateState = this.updateState.bind(this);
  }

  componentDidMount() {
    this.updateState(this.state);
  }

  componentDidUpdate(prevProps) {
    if (this.props.type !== prevProps.type || !_.isEqual(this.props.baseCfg, prevProps.baseCfg)) {
      this.updateState(this.state);
    }
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const cfg = _.pick(currState, ["model"]);
    this.setState(currState, () => this.props.updateState({ cfg }));
  }

  render() {
    const { t } = this.props;
    return (
      <>
        {this.props.type === "seasonal_decompose" && (
          <div className="col-md-4">
            <div className="form-group row">
              <label className="col-md-3 col-form-label text-right">{t("timeseries:Model")}</label>
              <div className="col-md-8">
                <div className="btn-group compact pl-0">
                  {_.map(["additive", "multiplicative"], (model, i) => {
                    const buttonProps = { className: "btn" };
                    if (model === this.state.model) {
                      buttonProps.className += " btn-primary active";
                    } else {
                      buttonProps.className += " btn-primary inactive";
                      buttonProps.onClick = () => this.updateState({ model });
                    }
                    return (
                      <button key={i} {...buttonProps}>
                        <span className="d-block">{t(`timeseries:${model}`)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
}
ReactSeasonalDecompose.displayName = "ReactSeasonalDecompose";
ReactSeasonalDecompose.propTypes = {
  updateState: PropTypes.func,
  t: PropTypes.func,
  type: PropTypes.string,
  baseCfg: PropTypes.object,
};
export const SeasonalDecompose = withTranslation(["timeseries", "constants"])(ReactSeasonalDecompose);
