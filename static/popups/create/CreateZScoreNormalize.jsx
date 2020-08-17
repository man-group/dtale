import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import ColumnSelect from "./ColumnSelect";

function validateZScoreNormalizeCfg({ col }) {
  if (!col) {
    return "Please select a column to normalize!";
  }
  return null;
}

function buildCode({ col }) {
  if (!col) {
    return null;
  }

  return `(df['${col}'] - data['${col}'].mean()) / data['${col}'].std(ddof=0)`;
}

class CreateZScoreNormalize extends React.Component {
  constructor(props) {
    super(props);
    this.state = { group: null, col: null, agg: null };
    this.updateState = this.updateState.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const updatedState = {
      cfg: {
        col: _.get(currState, "col.value") || null,
      },
    };
    updatedState.code = buildCode(updatedState.cfg);
    if (_.get(state, "col") && !this.props.namePopulated) {
      updatedState.name = `${updatedState.cfg.col}_normalize`;
    }
    this.setState(currState, () => this.props.updateState(updatedState));
  }

  render() {
    return (
      <ColumnSelect
        label="Col"
        prop="col"
        parent={this.state}
        updateState={this.updateState}
        columns={this.props.columns}
        dtypes={["int", "float"]}
      />
    );
  }
}
CreateZScoreNormalize.displayName = "CreateZScoreNormalize";
CreateZScoreNormalize.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
  namePopulated: PropTypes.bool,
};

export { CreateZScoreNormalize, validateZScoreNormalizeCfg, buildCode };
