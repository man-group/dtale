import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import Select, { createFilter } from "react-select";

const OPERANDS = [
  ["=", "Equals"],
  ["<", "Less Than"],
  [">", "Greater Than"],
  ["<=", "Less Than or Equal"],
  [">=", "Greater Than or Equal"],
  ["[]", "Range (Inclusive)"],
  ["()", "Range (Exclusive)"],
];

function createValueInput(updateState, { missing }, state, prop) {
  return (
    <div key={prop} className="row pt-3">
      <div className="col-auto m-auto">
        <input
          type="text"
          placeholder={`Enter ${_.capitalize(prop)}...`}
          className="form-control numeric-filter"
          value={state[prop] || ""}
          disabled={missing}
          onChange={e => updateState({ [prop]: e.target.value })}
        />
      </div>
    </div>
  );
}

function buildState({ columnFilters, selectedCol, min, max }) {
  const cfg = _.get(columnFilters, selectedCol, { operand: "=" });
  const selected = cfg.operand === "=" ? _.map(cfg.value || null, v => ({ value: v })) : null;
  const value = cfg.operand === "=" ? "" : cfg.value;
  const { operand } = cfg;
  return {
    selected,
    operand,
    minimum: (cfg.min || min) + "",
    maximum: (cfg.max || max) + "",
    value: value + "",
  };
}

class NumericFilter extends React.Component {
  constructor(props) {
    super(props);
    this.state = buildState(props);
    this.updateState = this.updateState.bind(this);
    this.renderOperandInputs = this.renderOperandInputs.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (this.props.selectedCol !== prevProps.selectedCol) {
      this.setState(buildState(this.props));
    }
  }

  updateState(state) {
    const updatedState = _.assignIn({}, this.state, state);
    const { colType } = this.props;
    const parseFunc = colType === "int" ? parseInt : parseFloat;
    let cfg = { type: colType, operand: updatedState.operand };
    const updateCfgForVal = () => {
      const numVal = parseFunc(updatedState.value);
      if (_.isNaN(numVal)) {
        cfg = { type: colType };
        return;
      }
      cfg.value = numVal;
    };
    switch (cfg.operand) {
      case "=": {
        if (colType === "int") {
          cfg.value = _.map(updatedState.selected || [], "value");
        } else {
          updateCfgForVal();
        }
        break;
      }
      case "<":
      case ">":
      case "<=":
      case ">=":
        updateCfgForVal();
        break;
      case "[]":
      case "()": {
        let { minimum, maximum } = updatedState;
        minimum = parseFunc(minimum);
        maximum = parseFunc(maximum);
        if (!_.isNaN(minimum)) {
          cfg.min = minimum;
        }
        if (!_.isNaN(maximum)) {
          cfg.max = maximum;
        }
        if (_.isUndefined(cfg.min) && _.isUndefined(cfg.max)) {
          cfg = { type: colType };
          break;
        }
        if (this.props.min == cfg.min && this.props.max == cfg.max) {
          cfg = { type: colType };
          break;
        }
      }
    }
    this.setState(updatedState, () => this.props.updateState(cfg));
  }

  renderOperandInputs() {
    const { operand } = this.state;
    const { colType } = this.props;
    switch (operand) {
      case "<":
      case ">":
      case "<=":
      case ">=":
        return createValueInput(this.updateState, this.props, this.state, "value");
      case "[]":
      case "()":
        return [
          createValueInput(this.updateState, this.props, this.state, "minimum"),
          createValueInput(this.updateState, this.props, this.state, "maximum"),
        ];
      case "=":
      default: {
        if (colType === "float") {
          return createValueInput(this.updateState, this.props, this.state, "value");
        }
        return (
          <div key={2} className="row pt-3">
            <div className="col-md-12">
              <Select
                isMulti
                isDisabled={this.props.missing}
                className="Select is-clearable is-searchable Select--single m-auto"
                classNamePrefix="Select"
                options={_.map(this.props.uniques, o => ({ value: o }))}
                getOptionLabel={_.property("value")}
                getOptionValue={_.property("value")}
                value={this.state.selected}
                onChange={selected => this.updateState({ selected })}
                isClearable
                filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
              />
            </div>
          </div>
        );
      }
    }
  }

  render() {
    return [
      <div key={0} className="row">
        <div className="col-md-12">
          <div className="btn-group compact m-auto font-weight-bold column-sorting" style={{ fontSize: "16px" }}>
            {_.map(OPERANDS, ([operand, hint], i) => {
              const active = this.state.operand === operand;
              return (
                <button
                  key={i}
                  style={active ? {} : { color: "#565b68" }}
                  className={`btn btn-primary ${active ? "active" : ""} font-weight-bold`}
                  onClick={() => this.updateState({ operand })}
                  title={hint}
                  disabled={active || this.props.missing}>
                  {operand}
                </button>
              );
            })}
          </div>
        </div>
      </div>,
      this.renderOperandInputs(),
    ];
  }
}
NumericFilter.displayName = "NumericFilter";
NumericFilter.propTypes = {
  selectedCol: PropTypes.string,
  columnFilters: PropTypes.object, // eslint-disable-line react/no-unused-prop-types
  updateState: PropTypes.func,
  uniques: PropTypes.array,
  colType: PropTypes.string,
  min: PropTypes.number,
  max: PropTypes.number,
  missing: PropTypes.bool,
};

export { NumericFilter };
