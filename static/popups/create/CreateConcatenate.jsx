import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import { validateNumericCfg } from "./CreateNumeric";
import Operand from "./Operand";

export function validateConcatenateCfg(t, cfg) {
  return validateNumericCfg(t, { ...cfg, operation: "sum" });
}

export function buildCode({ left, right }) {
  let code = "";
  if (left.type === "col") {
    const col = _.get(left, "col.value");
    if (!col) {
      return null;
    }
    code += `df['${col}'].astype('str')`;
  } else {
    if (_.isNull(left.val) || left.val === "") {
      return null;
    }
    code += `'${left.val}'`;
  }
  code += " + ";
  if (right.type === "col") {
    const col = _.get(right, "col.value");
    if (!col) {
      return null;
    }
    code += `df['${col}'].astype('str')`;
  } else {
    if (_.isNull(right.val) || right.val === "") {
      return null;
    }
    code += `'${right.val}'`;
  }
  return code;
}

export default class CreateConcatenate extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      left: { type: "col", col: null, val: null },
      right: { type: "col", col: null, val: null },
    };
    this.updateState = this.updateState.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const left = { type: currState.left.type },
      right = { type: currState.right.type };
    if (left.type === "col") {
      left.col = _.get(currState, "left.col.value") || null;
    } else {
      left.val = currState.left.val;
    }
    if (right.type === "col") {
      right.col = _.get(currState, "right.col.value") || null;
    } else {
      right.val = currState.right.val;
    }
    const code = buildCode(currState);
    this.setState(currState, () => this.props.updateState({ cfg: { left, right }, code }));
  }

  render() {
    const { left, right } = this.state;
    return (
      <React.Fragment>
        <Operand
          name="left"
          cfg={left}
          otherOperand={right}
          dataType="text"
          updateState={this.updateState}
          columns={this.props.columns}
        />
        <Operand
          name="right"
          cfg={right}
          otherOperand={left}
          dataType="text"
          updateState={this.updateState}
          columns={this.props.columns}
        />
      </React.Fragment>
    );
  }
}
CreateConcatenate.displayName = "CreateConcatenate";
CreateConcatenate.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
};
