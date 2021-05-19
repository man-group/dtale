import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { StyledSlider, Thumb, Track } from "../../sliderUtils";
import ColumnSelect from "./ColumnSelect";

require("./CreateWinsorize.css");

export function validateWinsorizeCfg(t, { col }) {
  if (!col) {
    return t("Please select a column to winsorize!");
  }
  return null;
}

export function buildCode({ col, group, limits, inclusive }) {
  if (!col) {
    return null;
  }
  let winsorizeParams = [`limits=[${_.join(limits, ", ")}]`];
  if (_.some(inclusive)) {
    winsorizeParams.push(`inclusive=[${_.join(inclusive, ", ")}]`);
  }
  winsorizeParams = `, ${_.join(winsorizeParams, ", ")}`;
  const code = ["from scipy.stats import mstats\n"];
  if (_.size(group)) {
    code.push("def winsorize_series(group):");
    code.push(`\treturn mstats.winsorize(group${winsorizeParams})\n`);
    code.push(`df.groupby(['${_.join(group, "', '")}'])['${col}'].transform(winsorize_series)\n`);
  } else {
    code.push(`mstats.winsorize(df['${col}']${winsorizeParams})`);
  }
  return code;
}

class CreateWinsorize extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      group: null,
      col: null,
      limits: [10, 90],
      includeLower: true,
      includeUpper: true,
    };
    this.updateState = this.updateState.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const updatedState = {
      cfg: {
        col: _.get(currState, "col.value") || null,
        group: _.map(currState.group, "value") || null,
        limits: [_.round(currState.limits[0] / 100.0, 2), _.round(1.0 - currState.limits[1] / 100.0, 2)],
        inclusive: [currState.includeLower, currState.includeUpper],
      },
    };
    updatedState.code = buildCode(updatedState.cfg);
    if (_.get(state, "col") && !this.props.namePopulated) {
      updatedState.name = `${updatedState.cfg.col}_winsorize`;
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
          otherProps={["group"]}
          parent={this.state}
          updateState={this.updateState}
          columns={this.props.columns}
          dtypes={["int", "float"]}
        />
        <ColumnSelect
          label={t("Group By")}
          prop="group"
          otherProps={["col"]}
          parent={this.state}
          updateState={this.updateState}
          columns={this.props.columns}
          isMulti
        />
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">{t("Limits")}</label>
          <div className="col-md-8">
            <div className="input-group">
              <input
                type="text"
                className="form-control mr-3 slider-input"
                value={this.state.limits[0]}
                onChange={e =>
                  this.updateState({
                    limits: [parseInt(e.target.value), this.state.limits[1]],
                  })
                }
              />
              <StyledSlider
                defaultValue={this.state.limits}
                renderTrack={Track}
                renderThumb={Thumb}
                value={this.state.limits}
                onAfterChange={limits => this.updateState({ limits })}
              />
              <input
                type="text"
                className="form-control ml-3 slider-input"
                value={this.state.limits[1]}
                onChange={e =>
                  this.updateState({
                    limits: [this.state.limits[0], parseInt(e.target.value)],
                  })
                }
              />
            </div>
          </div>
        </div>
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">Include Limits</label>
          <div className="col-md-8 mt-auto mb-auto">
            <span>{t("Lower")}:</span>
            <i
              className={`ico-check-box${this.state.includeLower ? "" : "-outline-blank"} pointer pl-3 pr-5`}
              onClick={() => this.updateState({ includeLower: !this.state.includeLower })}
            />
            <span>{t("Upper")}:</span>
            <i
              className={`ico-check-box${this.state.includeUpper ? "" : "-outline-blank"} pointer pl-3`}
              onClick={() => this.updateState({ includeUpper: !this.state.includeUpper })}
            />
          </div>
        </div>
      </React.Fragment>
    );
  }
}
CreateWinsorize.displayName = "CreateWinsorize";
CreateWinsorize.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
  namePopulated: PropTypes.bool,
  t: PropTypes.func,
};

export default withTranslation("builders")(CreateWinsorize);
