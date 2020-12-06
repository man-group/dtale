import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import ColumnSelect from "./ColumnSelect";

function validateDiffCfg({ col, periods }) {
  if (!col) {
    return "Please select a column!";
  }
  if (!periods || !parseInt(periods)) {
    return "Please select a valid value for periods!";
  }
  return null;
}

function buildCode({ col, periods }) {
  if (!col) {
    return null;
  }
  if (!periods || !parseInt(periods)) {
    return null;
  }

  return `df['${col}'].diff(${periods})`;
}

class CreateDiff extends React.Component {
  constructor(props) {
    super(props);
    this.state = { periods: "1", col: null };
    this.updateState = this.updateState.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const updatedState = {
      cfg: {
        col: _.get(currState, "col.value") || null,
        periods: currState.periods,
      },
    };
    updatedState.code = buildCode(updatedState.cfg);
    if (_.get(state, "col") && !this.props.namePopulated) {
      updatedState.name = `${updatedState.cfg.col}_diff`;
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
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">Periods</label>
          <div className="col-md-8">
            <input
              className="form-control"
              value={this.state.periods}
              onChange={e => this.updateState({ periods: e.target.value })}
            />
          </div>
        </div>
      </React.Fragment>
    );
  }
}
CreateDiff.displayName = "CreateDiff";
CreateDiff.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
  namePopulated: PropTypes.bool,
};

export { CreateDiff, validateDiffCfg, buildCode };
