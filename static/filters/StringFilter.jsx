import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import Select, { createFilter } from "react-select";

import AsyncValueSelect from "./AsyncValueSelect";
import { EQ_TOGGLE, NE } from "./NumericFilter";
import ValueSelect from "./ValueSelect";

const ACTIONS = [
  { value: "equals", label: "Equals" },
  { value: "startswith", label: "Startswith" },
  { value: "endswith", label: "Endswith" },
  { value: "contains", label: "Contains" },
  { value: "length", label: "Length" },
];

class StringFilter extends React.Component {
  constructor(props) {
    super(props);
    const currFilter = _.get(props.columnFilters, props.selectedCol, {});
    currFilter.operand = currFilter.operand === "ne" ? NE : "=";
    const selected = _.map(_.get(currFilter, "value", null), v => ({
      value: v,
    }));
    this.state = {
      selected: selected,
      operand: currFilter.operand ?? EQ_TOGGLE[0][0],
      action: _.find(ACTIONS, { value: currFilter.action ?? "equals" }),
      raw: currFilter.raw,
      caseSensitive: currFilter.caseSensitive,
    };
    this.updateState = this.updateState.bind(this);
    this.renderInputHint = this.renderInputHint.bind(this);
  }

  updateState(state) {
    const updatedState = _.assignIn({}, this.state, state);
    const cfg = {
      type: "string",
      value: _.map(updatedState.selected || [], "value"),
      operand: updatedState.operand,
      action: _.get(updatedState.action, "value"),
      raw: updatedState.raw,
      caseSensitive: updatedState.caseSensitive,
    };
    if (cfg.action === "length" && _.find((cfg.raw || "").split(","), v => _.isNaN(parseInt(v)))) {
      // simply update immediate state if there is an invalid integer string specified
      this.setState(updatedState);
      return;
    }
    cfg.operand = cfg.operand === NE ? "ne" : cfg.operand;
    this.setState(updatedState, () => this.props.updateState(cfg));
  }

  renderInputHint() {
    const { action } = this.state;
    const { t } = this.props;
    const base = t("Press ENTER to submit", { ns: "correlations" });
    if (action.value === "length") {
      return `${base}. Enter integers for length. For a range enter '1,3' which means '1 <= str.length <= 3'.`;
    }
    return base;
  }

  render() {
    const { action, raw, caseSensitive } = this.state;
    const requiresAsync = this.props.uniqueCt > 500;
    const [operand, hint] = EQ_TOGGLE[1];
    const active = this.state.operand === NE;
    return (
      <>
        <div className="row pb-3">
          <div className="col-auto text-center pr-0 mt-auto mb-auto">
            <div className="btn-group compact m-auto font-weight-bold column-sorting" style={{ fontSize: "16px" }}>
              <button
                style={active ? {} : { color: "#565b68" }}
                className={`btn btn-primary ${active ? "active" : ""} font-weight-bold`}
                onClick={() => this.updateState({ operand: active ? EQ_TOGGLE[0][0] : NE })}
                title={this.props.t(active ? hint : EQ_TOGGLE[0][1])}
                disabled={this.props.missing}>
                {operand}
              </button>
            </div>
          </div>
          <div className="col-auto text-center pr-0 pl-3 mt-auto mb-auto">
            <div className="btn-group compact m-auto font-weight-bold column-sorting" style={{ fontSize: "16px" }}>
              <button
                style={active ? {} : { color: "#565b68" }}
                className={`btn btn-primary ${caseSensitive ? "active" : ""} font-weight-bold`}
                onClick={() => this.updateState({ caseSensitive: !caseSensitive })}
                title={`${this.props.t("Case-Sensitive")} (${caseSensitive ? "ON" : "OFF"})`}
                disabled={this.props.missing}>
                {"Aa"}
              </button>
            </div>
          </div>
          <div className="col pl-3">
            <Select
              className="Select is-clearable is-searchable Select--single"
              classNamePrefix="Select"
              options={ACTIONS}
              getOptionLabel={_.property("label")}
              getOptionValue={_.property("value")}
              value={this.state.action}
              onChange={selected => this.updateState({ action: selected })}
              filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
            />
          </div>
        </div>
        <div className="row">
          <div className="col-md-12 string-filter-inputs">
            {action.value === "equals" && !requiresAsync && (
              <ValueSelect {...this.props} selected={this.state.selected} updateState={this.updateState} />
            )}
            {action.value === "equals" && requiresAsync && (
              <AsyncValueSelect {...this.props} selected={this.state.selected} updateState={this.updateState} />
            )}
            {action.value !== "equals" && (
              <div data-tip={this.renderInputHint()}>
                <input
                  type="text"
                  className="form-control"
                  value={raw ?? ""}
                  onChange={e => this.setState({ raw: e.target.value })}
                  onKeyDown={e => (e.key === "Enter" ? this.updateState({}) : _.noop)}
                />
              </div>
            )}
          </div>
        </div>
      </>
    );
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
  t: PropTypes.func,
};
export default withTranslation(["column_filter", "correlations"])(StringFilter);
