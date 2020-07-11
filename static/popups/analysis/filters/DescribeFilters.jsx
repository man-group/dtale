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

function wrapFilterMarkup(filterMarkup) {
  return (
    <div className="form-group row small-gutters mb-3 mt-3">
      <div className="col row">
        <div className="col" />
        {filterMarkup}
        <div className="col" />
      </div>
    </div>
  );
}

function buildState(props) {
  return {
    type: "boxplot",
    bins: "20",
    top: (props.top || 100) + "",
    ordinalCol: null,
    ordinalAgg: _.find(ANALYSIS_AGGS, { value: "sum" }),
    categoryCol: null,
    categoryAgg: _.find(ANALYSIS_AGGS, { value: "mean" }),
  };
}

class DescribeFilters extends React.Component {
  constructor(props) {
    super(props);
    this.state = buildState(props);
    this.buildChart = this.buildChart.bind(this);
    this.buildChartTypeToggle = this.buildChartTypeToggle.bind(this);
    this.buildFilter = this.buildFilter.bind(this);
    this.updateOrdinal = this.updateOrdinal.bind(this);
    this.updateCategory = this.updateCategory.bind(this);
  }

  shouldComponentUpdate(newProps, newState) {
    const props = ["cols", "dtype", "code", "details"];
    if (!_.isEqual(_.pick(this.props, props), _.pick(newProps, props))) {
      return true;
    }
    return !_.isEqual(this.state, newState);
  }

  componentDidUpdate(prevProps) {
    if (!_.isEqual(this.props.details, prevProps.details)) {
      this.setState(buildState(this.props));
    }
  }

  buildChartTypeToggle() {
    const colType = gu.findColType(this.props.dtype);
    const options = [{ label: TITLES.boxplot, value: "boxplot" }];
    if (_.includes(["float", "int"], colType)) {
      options.push({ label: TITLES.histogram, value: "histogram" });
    }
    if (colType === "float") {
      options.push({ label: TITLES.categories, value: "categories" });
    } else {
      options.push({ label: TITLES.value_counts, value: "value_counts" });
    }
    const update = value => this.setState({ type: value }, this.buildChart);
    return <ButtonToggle options={options} update={update} defaultValue={this.state.type} />;
  }

  buildFilter(prop) {
    const propagateState = state => this.setState(state);
    return (
      <TextEnterFilter
        {...{
          key: "prop",
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
    let filterMarkup = null;
    if (this.state.type === "boxplot") {
      filterMarkup = null;
    } else if ("int" === colType) {
      // int -> Value Counts or Histogram
      if (this.state.type === "histogram") {
        filterMarkup = wrapFilterMarkup(this.buildFilter("bins"));
      } else {
        filterMarkup = wrapFilterMarkup([
          this.buildFilter("top"),
          <OrdinalInputs key="ordinal" updateOrdinal={this.updateOrdinal} {...this.props} />,
        ]);
      }
    } else if ("float" === colType) {
      // floats -> Histogram or Categories
      if (this.state.type === "histogram") {
        filterMarkup = wrapFilterMarkup(this.buildFilter("bins"));
      } else {
        filterMarkup = wrapFilterMarkup([
          this.buildFilter("top"),
          <CategoryInputs key="category" updateCategory={this.updateCategory} {...this.props} />,
        ]);
      }
    } else {
      // date, string, bool -> Value Counts
      filterMarkup = wrapFilterMarkup([
        this.buildFilter("top"),
        <OrdinalInputs key="ordinal" updateOrdinal={this.updateOrdinal} {...this.props} />,
      ]);
    }
    return (
      <React.Fragment>
        <div className="form-group row small-gutters mb-3 mt-3">
          <div className="col row">{this.buildChartTypeToggle()}</div>
          <div className="col-auto">
            <div>{renderCodePopupAnchor(code, TITLES[this.state.type])}</div>
          </div>
        </div>
        {filterMarkup}
      </React.Fragment>
    );
  }
}
DescribeFilters.displayName = "DescribeFilters";
DescribeFilters.propTypes = {
  selectedCol: PropTypes.string,
  cols: PropTypes.array,
  dtype: PropTypes.string,
  code: PropTypes.string,
  type: PropTypes.string,
  top: PropTypes.number,
  buildChart: PropTypes.func,
  details: PropTypes.object,
};

export { DescribeFilters };
