import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import ColumnSelect from "./ColumnSelect";

function validateExponentialSmoothingCfg({ col, alpha }) {
  if (!col) {
    return "Please select a column to smooth!";
  }
  if (!parseFloat(alpha)) {
    return "Please enter a valid float for alpha!";
  }
  return null;
}

function buildCode({ col, alpha }) {
  if (!col) {
    return null;
  }
  if (!parseFloat(alpha)) {
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
    this.state = { col: null, alpha: "0.0" };
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
    return (
      <React.Fragment>
        <ColumnSelect
          label="Col"
          prop="col"
          parent={this.state}
          updateState={this.updateState}
          columns={this.props.columns}
          dtypes={["int", "float"]}
        />
        <div key={2} className="form-group row">
          <label className="col-md-3 col-form-label text-right">Alpha</label>
          <div className="col-md-8">
            <input
              type="number"
              className="form-control"
              value={this.state.alpha}
              onChange={e => this.updateState({ alpha: e.target.value })}
            />
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
};

export { CreateExponentialSmoothing, validateExponentialSmoothingCfg, buildCode };
