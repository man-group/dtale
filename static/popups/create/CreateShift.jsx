import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { findColType } from "../../dtale/gridUtils";
import ColumnSelect from "./ColumnSelect";
import { getDtype } from "./CreateTypeConversion";

export function validateShiftCfg(t, { col }) {
  if (!col) {
    return t("Please select a column!");
  }
  return null;
}

export function buildCode({ col, periods, fillValue, dtype }) {
  if (!col) {
    return null;
  }
  let kwargs = "";
  if (fillValue !== undefined) {
    kwargs = findColType(dtype) === "string" ? `, fill_value='${fillValue}'` : `, fill_value=${fillValue}`;
  }
  return `df['${col}'].shift(${periods || 1}${kwargs})`;
}

class CreateShift extends React.Component {
  constructor(props) {
    super(props);
    this.state = { col: null, periods: 1 };
    this.updateState = this.updateState.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const col = _.get(currState, "col.value") || null;
    const updatedState = {
      cfg: {
        col,
        periods: currState.periods,
        fillValue: currState.fillValue,
      },
    };
    if (col) {
      updatedState.cfg.dtype = getDtype(currState.col, this.props.columns);
    }
    updatedState.code = buildCode(updatedState.cfg);
    if (_.get(state, "col") && !this.props.namePopulated) {
      updatedState.name = `${updatedState.cfg.col}_shift`;
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
        />
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">{t("Periods")}</label>
          <div className="col-md-8">
            <input
              type="number"
              className="form-control"
              value={this.state.periods}
              onChange={e => this.updateState({ periods: e.target.value })}
            />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">{t("Fill Value")}</label>
          <div className="col-md-8">
            <input
              type="text"
              className="form-control"
              value={this.state.fillValue || ""}
              onChange={e => this.updateState({ fillValue: e.target.value })}
              placeholder="NaN"
            />
          </div>
        </div>
      </React.Fragment>
    );
  }
}
CreateShift.displayName = "CreateShift";
CreateShift.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
  namePopulated: PropTypes.bool,
  t: PropTypes.func,
};

export default withTranslation("builders")(CreateShift);
