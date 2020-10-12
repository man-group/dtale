import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import ColumnSelect from "./ColumnSelect";

function validateStringCfg({ cols }) {
  if (!cols || _.size(cols) < 2) {
    return "Please select at least 2 columns to concatenate!";
  }
  return null;
}

function buildCode({ cols, joinChar }) {
  if (!cols || _.size(cols) < 2) {
    return null;
  }

  return `df['${_.join(cols, "', '")}'].astype('str').agg('${joinChar}'.join, axis=1)`;
}

class CreateString extends React.Component {
  constructor(props) {
    super(props);
    this.state = { cols: null, joinChar: "_" };
    this.updateState = this.updateState.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const updatedState = {
      cfg: {
        cols: _.map(currState.cols, "value") || null,
        joinChar: currState.joinChar,
      },
    };
    updatedState.code = buildCode(updatedState.cfg);
    if (validateStringCfg(updatedState.cfg) === null && !this.props.namePopulated) {
      updatedState.name = `${_.join(updatedState.cfg.cols, "_")}_concat`;
    }
    this.setState(currState, () => this.props.updateState(updatedState));
  }

  render() {
    return (
      <React.Fragment>
        <ColumnSelect
          label="Columns"
          prop="cols"
          parent={this.state}
          updateState={this.updateState}
          columns={this.props.columns}
          isMulti
        />
        <div key={3} className="form-group row">
          <label className="col-md-3 col-form-label text-right">Join Character</label>
          <div className="col-md-8">
            <input
              type="text"
              className="form-control"
              value={this.state.joinChar}
              onChange={e => this.updateState({ labels: e.target.value })}
            />
          </div>
        </div>
      </React.Fragment>
    );
  }
}
CreateString.displayName = "CreateString";
CreateString.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
  namePopulated: PropTypes.bool,
};

export { CreateString, validateStringCfg, buildCode };
