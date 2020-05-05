import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import Select, { createFilter } from "react-select";

import { exports as gu } from "../../dtale/gridUtils";
import { renderCodePopupAnchor } from "../CodePopup";
import { AGGREGATION_OPTS } from "../charts/Aggregations";

const ANALYSIS_AGGS = _.concat(AGGREGATION_OPTS, [{ value: "pctsum", label: "Percentage Sum" }]);

function createSelect(selectProps, labelProp = "value") {
  return (
    <Select
      className="Select is-clearable is-searchable Select--single"
      classNamePrefix="Select"
      getOptionLabel={_.property(labelProp)}
      getOptionValue={_.property("value")}
      filterOption={createFilter({ ignoreAccents: false })}
      {...selectProps}
    />
  );
}
class ColumnAnalysisFilters extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      type: props.type,
      bins: "20",
      top: (props.top || 100) + "",
      ordinalCol: null,
      categoryCol: null,
    };
    this.state.ordinalAgg = _.find(ANALYSIS_AGGS, { value: "sum" });
    this.state.categoryAgg = _.find(ANALYSIS_AGGS, { value: "mean" });
    this.buildChart = this.buildChart.bind(this);
    this.buildChartTypeToggle = this.buildChartTypeToggle.bind(this);
    this.buildFilter = this.buildFilter.bind(this);
    this.buildOrdinalInputs = this.buildOrdinalInputs.bind(this);
    this.buildCategoryInputs = this.buildCategoryInputs.bind(this);
  }

  shouldComponentUpdate(newProps, newState) {
    const props = ["cols", "dtype", "code"];
    if (!_.isEqual(_.pick(this.props, props), _.pick(newProps, props))) {
      return true;
    }
    return !_.isEqual(this.state, newState);
  }

  buildChartTypeToggle() {
    const colType = gu.findColType(this.props.dtype);
    const options = [["Histogram", "histogram"]];
    if (colType === "float") {
      options.push(["Categories", "categories"]);
    } else {
      options.push(["Value Counts", "value_counts"]);
    }
    return (
      <div className="col-auto btn-group">
        {_.map(options, ([label, value]) => {
          const buttonProps = { className: "btn" };
          if (value === this.state.type) {
            buttonProps.className += " btn-primary active";
          } else {
            buttonProps.className += " btn-primary inactive";
            buttonProps.onClick = () => this.setState({ type: value }, this.buildChart);
          }
          return (
            <button key={value} {...buttonProps}>
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  buildFilter(prop) {
    const colType = gu.findColType(this.props.dtype);
    const updateFilter = e => {
      if (e.key === "Enter") {
        if (this.state[prop] && parseInt(this.state[prop])) {
          this.buildChart();
        }
        e.preventDefault();
      }
    };
    return [
      <div key={0} className={`col-auto text-center pr-4 ${colType === "int" ? "pl-0" : ""}`}>
        <div>
          <b>{_.capitalize(prop)}</b>
        </div>
        <div style={{ marginTop: "-.5em" }}>
          <small>(Please edit)</small>
        </div>
      </div>,
      <div key={1} style={{ width: "3em" }} data-tip="Press ENTER to submit" className="mb-auto mt-auto">
        <input
          type="text"
          className="form-control text-center column-analysis-filter"
          value={this.state[prop]}
          onChange={e => this.setState({ [prop]: e.target.value })}
          onKeyPress={updateFilter}
        />
      </div>,
    ];
  }

  buildChart() {
    this.props.buildChart(this.state);
  }

  buildOrdinalInputs() {
    const updateOrdinal = (prop, val) => {
      const currState = _.assignIn({}, _.pick(this.state, ["ordinalCol", "ordinalAgg"]), { [prop]: val });
      this.setState(currState, () => {
        if (currState.ordinalCol && currState.ordinalAgg) {
          this.buildChart();
        }
      });
    };
    const { cols, selectedCol } = this.props;
    let colOpts = _.filter(cols, c => c.name !== selectedCol && _.includes(["float", "int"], gu.findColType(c.dtype)));
    colOpts = _.sortBy(
      _.map(colOpts, c => ({ value: c.name })),
      c => _.toLower(c.value)
    );
    return [
      <div key={0} className="col-auto text-center pr-4">
        <div>
          <b>Ordinal</b>
        </div>
        <div style={{ marginTop: "-.5em" }}>
          <small>(Choose Col/Agg)</small>
        </div>
      </div>,
      <div key={1} className="col-auto pl-0 mr-3 ordinal-dd">
        {createSelect({
          value: this.state.ordinalCol,
          options: colOpts,
          onChange: v => updateOrdinal("ordinalCol", v),
          noOptionsText: () => "No columns found",
          isClearable: true,
        })}
      </div>,
      <div key={2} className="col-auto pl-0 mr-3 ordinal-dd">
        {createSelect(
          {
            value: this.state.ordinalAgg,
            options: ANALYSIS_AGGS,
            onChange: v => updateOrdinal("ordinalAgg", v),
          },
          "label"
        )}
      </div>,
    ];
  }

  buildCategoryInputs() {
    const updateCategory = (prop, val) => {
      const currState = _.assignIn({}, _.pick(this.state, ["categoryCol", "categoryAgg"]), { [prop]: val });
      this.setState(currState, () => {
        if (currState.categoryCol && currState.categoryAgg) {
          this.buildChart();
        }
      });
    };
    const { cols, selectedCol } = this.props;
    let colOpts = _.reject(cols, c => c.name === selectedCol || gu.findColType(c.dtype) === "float");
    colOpts = _.sortBy(
      _.map(colOpts, c => ({ value: c.name })),
      c => _.toLower(c.value)
    );
    return [
      <div key={0} className="col-auto text-center pr-4">
        <div>
          <b>Category Breakdown</b>
        </div>
        <div style={{ marginTop: "-.5em" }}>
          <small>(Choose Col/Agg)</small>
        </div>
      </div>,
      <div key={1} className="col-auto pl-0 mr-3 ordinal-dd">
        {createSelect({
          value: this.state.categoryCol,
          options: colOpts,
          onChange: v => updateCategory("categoryCol", v),
          noOptionsText: () => "No columns found",
          isClearable: true,
        })}
      </div>,
      <div key={2} className="col-auto pl-0 mr-3 ordinal-dd">
        {createSelect(
          {
            value: this.state.categoryAgg,
            options: ANALYSIS_AGGS,
            onChange: v => updateCategory("categoryAgg", v),
          },
          "label"
        )}
      </div>,
    ];
  }

  render() {
    if (_.isNull(this.props.type)) {
      return null;
    }
    const { code, dtype } = this.props;
    const colType = gu.findColType(dtype);
    const title = this.state.type === "histogram" ? "Histogram" : "Value Counts";
    let filterMarkup = null;
    if ("int" === colType) {
      // int -> Value Counts or Histogram
      if (this.state.type === "histogram") {
        filterMarkup = (
          <div className="col row">
            {this.buildChartTypeToggle()}
            {this.buildFilter("bins")}
          </div>
        );
      } else {
        filterMarkup = (
          <div className="col row">
            {this.buildChartTypeToggle()}
            {this.buildFilter("top")}
            {this.buildOrdinalInputs()}
          </div>
        );
      }
    } else if ("float" === colType) {
      // floats -> Histogram or Categories
      if (this.state.type === "histogram") {
        filterMarkup = (
          <div className="col row">
            {this.buildChartTypeToggle()}
            {this.buildFilter("bins")}
          </div>
        );
      } else {
        filterMarkup = (
          <div className="col row">
            {this.buildChartTypeToggle()}
            {this.buildFilter("top")}
            {this.buildCategoryInputs()}
          </div>
        );
      }
    } else {
      // date, string, bool -> Value Counts
      filterMarkup = (
        <div className="col row">
          <h4 className="pl-5 pt-3 modal-title font-weight-bold">{title}</h4>
          {this.buildFilter("top")}
          {this.buildOrdinalInputs()}
        </div>
      );
    }
    return (
      <div className="form-group row small-gutters mb-0">
        {filterMarkup}
        <div className="col-auto">
          <div>{renderCodePopupAnchor(code, title)}</div>
        </div>
      </div>
    );
  }
}
ColumnAnalysisFilters.displayName = "ColumnAnalysisFilters";
ColumnAnalysisFilters.propTypes = {
  selectedCol: PropTypes.string,
  cols: PropTypes.array,
  dtype: PropTypes.string,
  code: PropTypes.string,
  type: PropTypes.string,
  top: PropTypes.number,
  buildChart: PropTypes.func,
};

export { ColumnAnalysisFilters };
