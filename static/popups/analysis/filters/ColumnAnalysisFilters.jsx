import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import ButtonToggle from "../../../ButtonToggle";
import { exports as gu } from "../../../dtale/gridUtils";
import { renderCodePopupAnchor } from "../../CodePopup";
import CategoryInputs from "./CategoryInputs";
import { ANALYSIS_AGGS, TITLES } from "./Constants";
import OrdinalInputs from "./OrdinalInputs";
import TextEnterFilter from "./TextEnterFilter";

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
    this.updateOrdinal = this.updateOrdinal.bind(this);
    this.updateCategory = this.updateCategory.bind(this);
  }

  shouldComponentUpdate(newProps, newState) {
    const props = ["cols", "dtype", "code", "top"];
    if (!_.isEqual(_.pick(this.props, props), _.pick(newProps, props))) {
      return true;
    }
    return !_.isEqual(this.state, newState);
  }

  componentDidUpdate(prevProps) {
    if (this.props.top !== prevProps.top) {
      this.setState({ top: (this.props.top || 100) + "" });
    }
  }

  buildChartTypeToggle() {
    const colType = gu.findColType(this.props.dtype);
    let options = [{ label: TITLES.histogram, value: "histogram" }];
    if (colType == "string") {
      options = [
        { label: TITLES.value_counts, value: "value_counts" },
        { label: TITLES.word_value_counts, value: "word_value_counts" },
      ];
    } else if (colType === "float") {
      options.push({ label: TITLES.categories, value: "categories" });
    } else {
      options.push({ label: TITLES.value_counts, value: "value_counts" });
    }
    const update = value => this.setState({ type: value, top: null }, this.buildChart);
    return <ButtonToggle options={options} update={update} defaultValue={this.state.type} />;
  }

  buildFilter(prop) {
    const propagateState = state => this.setState(state);
    return (
      <TextEnterFilter
        {...{
          prop,
          buildChart: this.buildChart,
          dtype: this.props.dtype,
          propagateState,
          defaultValue: this.state[prop],
        }}
      />
    );
  }

  buildChart() {
    this.props.buildChart(this.state);
  }

  updateOrdinal(prop, val) {
    const currState = _.assignIn({}, _.pick(this.state, ["ordinalCol", "ordinalAgg"]), { [prop]: val });
    this.setState(currState, () => {
      if (currState.ordinalCol && currState.ordinalAgg) {
        this.buildChart();
      }
    });
  }

  updateCategory(prop, val) {
    const currState = _.assignIn({}, _.pick(this.state, ["categoryCol", "categoryAgg"]), { [prop]: val });
    this.setState(currState, () => {
      if (currState.categoryCol && currState.categoryAgg) {
        this.buildChart();
      }
    });
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
            <OrdinalInputs updateOrdinal={this.updateOrdinal} {...this.props} />
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
            <CategoryInputs key="category" updateCategory={this.updateCategory} {...this.props} />
          </div>
        );
      }
    } else {
      // date, string, bool -> Value Counts
      filterMarkup = (
        <div className="col row">
          {this.buildChartTypeToggle()}
          <h4 className="pl-5 pt-3 modal-title font-weight-bold">{title}</h4>
          {this.buildFilter("top")}
          <OrdinalInputs updateOrdinal={this.updateOrdinal} {...this.props} />
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
