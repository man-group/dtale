import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import Select, { createFilter } from "react-select";

import { exports as gu } from "../../dtale/gridUtils";

function validateNumericCfg(cfg) {
  const left = _.get(cfg, "left", {});
  const right = _.get(cfg, "right", {});
  const operation = _.get(cfg, "operation") || null;
  if (_.isNull(operation)) {
    return "Please select an operation!";
  }
  if (left.type === "col" && _.isNull(left.col)) {
    return "Left side is missing a column selection!";
  } else if (_.isNull(left.val) || left.val === "") {
    return "Left side is missing a static value!";
  }
  if (right.type === "col" && _.isNull(right.col)) {
    return "Right side is missing a column selection!";
  } else if (_.isNull(right.val) || right.val === "") {
    return "Right side is missing a static value!";
  }
  return null;
}

const OPERATION_MAPPING = {
  sum: " + ",
  difference: " - ",
  multiply: " * ",
  divide: " \\ ",
};

function buildCode({ left, operation, right }) {
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
    this.renderOperand = this.renderOperand.bind(this);
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

  renderOperand(prop, otherProp) {
    const { col, type, val } = this.state[prop];
    let input = null;
    if (type === "col") {
      const columns = _.map(
        _.filter(this.props.columns || [], c => _.includes(["int", "float"], gu.findColType(c.dtype))),
        ({ name }) => ({ value: name })
      );
      const otherOperand = this.state[otherProp];
      const otherCol = otherOperand.type === "col" ? otherOperand.col : null;
      const finalOptions = _.isNull(otherCol) ? columns : _.reject(columns, otherCol);
      input = (
        <div className="input-group">
          <Select
            className="Select is-clearable is-searchable Select--single"
            classNamePrefix="Select"
            options={_.sortBy(finalOptions, o => _.toLower(o.value))}
            getOptionLabel={_.property("value")}
            getOptionValue={_.property("value")}
            value={col}
            onChange={selected =>
              this.updateState({
                [prop]: _.assign({}, this.state[prop], { col: selected }),
              })
            }
            noOptionsText={() => "No columns found"}
            isClearable
            filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
          />
        </div>
      );
    } else {
      const onChange = e =>
        this.updateState({
          [prop]: _.assign({}, this.state[prop], { val: e.target.value }),
        });
      input = (
        <div className="input-group">
          <input type="number" className="form-control numeric-input" value={val || ""} onChange={onChange} />
        </div>
      );
    }
    return (
      <div key={prop} className="form-group row">
        <div className="col-md-3 text-right">
          <div className="btn-group">
            {_.map(["col", "val"], t => {
              const buttonProps = { className: "btn" };
              if (t === type) {
                buttonProps.className += " btn-primary active";
              } else {
                buttonProps.className += " btn-primary inactive";
                buttonProps.onClick = () =>
                  this.updateState({
                    [prop]: _.assign({}, this.state[prop], { type: t }),
                  });
              }
              return (
                <button key={`${prop}-${t}`} {...buttonProps}>
                  {_.capitalize(t)}
                </button>
              );
            })}
          </div>
        </div>
        <div className="col-md-8">{input}</div>
      </div>
    );
  }

  render() {
    return [
      <div key={0} className="form-group row">
        <label className="col-md-3 col-form-label text-right">Operation</label>
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
                  {_.capitalize(operation)}
                </button>
              );
            })}
          </div>
        </div>
      </div>,
      this.renderOperand("left", "right"),
      this.renderOperand("right", "left"),
    ];
  }
}
CreateNumeric.displayName = "CreateNumeric";
CreateNumeric.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
};

export { CreateNumeric, validateNumericCfg, buildCode };
