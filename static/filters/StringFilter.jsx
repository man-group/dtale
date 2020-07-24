import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import AsyncValueSelect from "./AsyncValueSelect";
import { EQ_TOGGLE, NE } from "./NumericFilter";
import ValueSelect from "./ValueSelect";

class StringFilter extends React.Component {
  constructor(props) {
    super(props);
    const currFilter = _.get(props.columnFilters, props.selectedCol, {});
    currFilter.operand = currFilter.operand === "ne" ? NE : "=";
    const selected = _.map(_.get(currFilter, "value", null), v => ({
      value: v,
    }));
    this.state = { selected: selected, operand: currFilter.operand };
    this.updateState = this.updateState.bind(this);
  }

  updateState(state) {
    const updatedState = _.assignIn({}, this.state, state);
    const cfg = {
      type: "string",
      value: _.map(updatedState.selected || [], "value"),
      operand: updatedState.operand,
    };
    cfg.operand = cfg.operand === NE ? "ne" : cfg.operand;
    this.setState(updatedState, () => this.props.updateState(cfg));
  }

  render() {
    const requiresAsync = this.props.uniqueCt > 500;
    return [
      <div key={0} className="row pb-3">
        <div className="col-md-12 text-center">
          <div className="btn-group compact m-auto font-weight-bold column-sorting" style={{ fontSize: "16px" }}>
            {_.map(EQ_TOGGLE, ([operand, hint], i) => {
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
      <div key={1} className="row">
        <div className="col-md-12">
          {!requiresAsync && (
            <ValueSelect {...this.props} selected={this.state.selected} updateState={this.updateState} />
          )}
          {requiresAsync && (
            <AsyncValueSelect {...this.props} selected={this.state.selected} updateState={this.updateState} />
          )}
        </div>
      </div>,
    ];
  }
}
StringFilter.displayName = "StringFilter";
StringFilter.propTypes = {
  selectedCol: PropTypes.string,
  columnFilters: PropTypes.object, // eslint-disable-line react/no-unused-prop-types
  updateState: PropTypes.func,
  uniques: PropTypes.array,
  missing: PropTypes.bool,
  uniqueCt: PropTypes.number,
};

export { StringFilter };
