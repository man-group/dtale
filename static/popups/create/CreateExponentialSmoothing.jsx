import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { StyledSlider, Thumb, Track } from "../../sliderUtils";
import ColumnSelect from "./ColumnSelect";

export function validateExponentialSmoothingCfg(t, { col, alpha }) {
  if (!col) {
    return t("Please select a column to smooth!");
  }
  if (!alpha) {
    return t("Please enter a valid float for alpha!");
  }
  return null;
}

export function buildCode({ col, alpha }) {
  if (!col) {
    return null;
  }
  if (!alpha) {
    return null;
  }
  return [
    `s = df['${col}'].values`,
    "result = [s[0]]",
    "for n in range(1, len(s)):",
    `\tresult.append(${alpha} * s[n] + (1 - ${alpha}) * result[n - 1])`,
    "pd.Series(result, index=df.index)",
  ];
}

class CreateExponentialSmoothing extends React.Component {
  constructor(props) {
    super(props);
    this.state = { col: null, alpha: 0.0 };
    this.updateState = this.updateState.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const updatedState = {
      cfg: {
        col: _.get(currState, "col.value") || null,
        alpha: currState.alpha,
      },
    };
    updatedState.code = buildCode(updatedState.cfg);
    if (_.get(state, "col") && !this.props.namePopulated) {
      updatedState.name = `${updatedState.cfg.col}_exp_smooth`;
    }
    this.setState(currState, () => this.props.updateState(updatedState));
  }

  render() {
    const { t } = this.props;
    return (
      <React.Fragment>
        <ColumnSelect
          label={t("Col")}
          prop="col"
          parent={this.state}
          updateState={this.updateState}
          columns={this.props.columns}
          dtypes={["int", "float"]}
        />
        <div key={2} className="form-group row">
          <label className="col-md-3 col-form-label text-right">{t("Alpha")}</label>
          <div className="col-md-8">
            <div className="input-group">
              <input
                type="number"
                className="form-control mr-3 alpha-slider-input"
                value={this.state.alpha}
                onChange={e => this.updateState({ alpha: parseFloat(e.target.value) ?? 0.0 })}
              />
              <StyledSlider
                defaultValue={this.state.alpha}
                renderTrack={Track}
                renderThumb={Thumb}
                value={this.state.alpha}
                min={0.0}
                max={1.0}
                step={0.01}
                onAfterChange={alpha => this.updateState({ alpha })}
              />
            </div>
            <small>{t("alpha_description")}</small>
          </div>
        </div>
      </React.Fragment>
    );
  }
}
CreateExponentialSmoothing.displayName = "CreateExponentialSmoothing";
CreateExponentialSmoothing.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
  namePopulated: PropTypes.bool,
  t: PropTypes.func,
};

export default withTranslation("builders")(CreateExponentialSmoothing);
