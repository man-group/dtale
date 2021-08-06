import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import Operand from "./Operand";

export function validateNumericCfg(t, cfg) {
  const left = _.get(cfg, "left", {});
  const right = _.get(cfg, "right", {});
  const operation = _.get(cfg, "operation") || null;
  if (_.isNull(operation)) {
    return t("Please select an operation!");
  }
  if (left.type === "col" && _.isNull(left.col)) {
    return t("Left side is missing a column selection!");
  } else if (_.isNull(left.val) || left.val === "") {
    return t("Left side is missing a static value!");
  }
  if (right.type === "col" && _.isNull(right.col)) {
    return t("Right side is missing a column selection!");
  } else if (_.isNull(right.val) || right.val === "") {
    return t("Right side is missing a static value!");
  }
  return null;
}

const OPERATION_MAPPING = {
  sum: " + ",
  difference: " - ",
  multiply: " * ",
  divide: " \\ ",
};

export function buildCode({ left, operation, right }) {
  let code = "";
  if (left.type === "col") {
    const col = _.get(left, "col.value");
    if (!col) {
      return null;
    }
    code += `df['${col}']`;
  } else {
    if (_.isNull(left.val) || left.val === "") {
      return null;
    }
    code += left.val;
  }
  if (!operation) {
    return null;
  }
  code += OPERATION_MAPPING[operation];
  if (right.type === "col") {
    const col = _.get(right, "col.value");
    if (!col) {
      return null;
    }
    code += `df['${col}']`;
  } else {
    if (_.isNull(right.val) || right.val === "") {
      return null;
    }
    code += right.val;
  }
  return code;
}

class CreateNumeric extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      left: { type: "col", col: null, val: null },
      operation: null,
      right: { type: "col", col: null, val: null },
    };
    this.updateState = this.updateState.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const { operation } = currState;
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
    this.setState(currState, () => this.props.updateState({ cfg: { left, operation, right }, code }));
  }

  render() {
    const { columns, t } = this.props;
    const { left, right } = this.state;
    return (
      <React.Fragment>
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">{t("Operation")}</label>
          <div className="col-md-8">
            <div className="btn-group">
              {_.map(["sum", "difference", "multiply", "divide"], operation => {
                const buttonProps = { className: "btn" };
                if (operation === this.state.operation) {
                  buttonProps.className += " btn-primary active";
                } else {
                  buttonProps.className += " btn-primary inactive";
                  buttonProps.onClick = () => this.updateState({ operation });
                }
                return (
                  <button key={operation} {...buttonProps}>
                    {t(_.capitalize(operation))}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <Operand
          name="left"
          cfg={left}
          otherOperand={right}
          dataType="number"
          colTypes={["int", "float"]}
          updateState={this.updateState}
          columns={columns}
        />
        <Operand
          name="right"
          cfg={right}
          otherOperand={left}
          dataType="number"
          colTypes={["int", "float"]}
          updateState={this.updateState}
          columns={columns}
        />
      </React.Fragment>
    );
  }
}
CreateNumeric.displayName = "CreateNumeric";
CreateNumeric.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
  t: PropTypes.func,
};

export default withTranslation("builders")(CreateNumeric);
