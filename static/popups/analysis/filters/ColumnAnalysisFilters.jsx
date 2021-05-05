import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import ButtonToggle from "../../../ButtonToggle";
import * as gu from "../../../dtale/gridUtils";
import { renderCodePopupAnchor } from "../../CodePopup";
import CategoryInputs from "./CategoryInputs";
import { analysisAggs, titles } from "./Constants";
import { default as GeoFilters, hasCoords, loadCoordVals } from "./GeoFilters";
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
      ...loadCoordVals(props.selectedCol, props.cols),
    };
    this.state.ordinalAgg = _.find(analysisAggs(props.t), { value: "sum" });
    this.state.categoryAgg = _.find(analysisAggs(props.t), { value: "mean" });
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
    const translatedTitles = titles(this.props.t);
    let options = [{ label: translatedTitles.histogram, value: "histogram" }];
    if (colType === "string") {
      options = [
        { label: translatedTitles.value_counts, value: "value_counts" },
        {
          label: translatedTitles.word_value_counts,
          value: "word_value_counts",
        },
      ];
    } else if (colType === "float") {
      options.push({ label: translatedTitles.categories, value: "categories" });
    } else {
      options.push({
        label: translatedTitles.value_counts,
        value: "value_counts",
      });
    }
    if (hasCoords(this.props.selectedCol, this.props.cols)) {
      options.push({
        label: translatedTitles.geolocation,
        value: "geolocation",
      });
    }
    if (colType !== "string") {
      options.push({ label: translatedTitles.qq, value: "qq" });
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
    const currState = _.assignIn({}, _.pick(this.state, ["ordinalCol", "ordinalAgg", "cleaners"]), { [prop]: val });
    const ordinalUpdate = _.get(currState, "ordinalCol") !== _.get(this.state, "ordinalCol");
    const ordinalAggUpdate = _.get(currState, "ordinalAgg") !== _.get(this.state, "ordinalAgg");
    const cleanerUpdate = _.get(currState, "cleaners") !== _.get(this.state, "cleaners");
    this.setState(currState, () => {
      if (ordinalUpdate || ordinalAggUpdate || cleanerUpdate) {
        this.buildChart();
      }
    });
  }

  updateCategory(prop, val) {
    const currState = _.assignIn({}, _.pick(this.state, ["categoryCol", "categoryAgg"]), { [prop]: val });
    if (prop === "categoryCol") {
      currState.top = "";
    }
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
    const { code, dtype, selectedCol, cols, t } = this.props;
    const colType = gu.findColType(dtype);
    const title = this.state.type === "histogram" ? "Histogram" : "Value Counts";
    let filterMarkup = null;
    if (this.state.type === "geolocation") {
      const update = val => this.setState(val, this.buildChart);
      filterMarkup = <GeoFilters col={selectedCol} columns={cols} {...this.state} update={update} />;
    } else if (this.state.type === "qq") {
      filterMarkup = null;
    } else if ("int" === colType) {
      // int -> Value Counts or Histogram
      if (this.state.type === "histogram") {
        filterMarkup = this.buildFilter("bins");
      } else {
        filterMarkup = (
          <React.Fragment>
            {this.buildFilter("top")}
            <OrdinalInputs colType={colType} updateOrdinal={this.updateOrdinal} {...this.props} />
          </React.Fragment>
        );
      }
    } else if ("float" === colType) {
      // floats -> Histogram or Categories
      if (this.state.type === "histogram") {
        filterMarkup = <React.Fragment>{this.buildFilter("bins")}</React.Fragment>;
      } else {
        filterMarkup = (
          <React.Fragment>
            {this.buildFilter("top")}
            <CategoryInputs key="category" updateCategory={this.updateCategory} {...this.props} />
          </React.Fragment>
        );
      }
    } else if (this.state.type === "histogram") {
      filterMarkup = <React.Fragment>{this.buildFilter("bins")}</React.Fragment>;
    } else {
      // date, string, bool -> Value Counts
      filterMarkup = (
        <React.Fragment>
          {this.buildFilter("top")}
          <OrdinalInputs colType={colType} updateOrdinal={this.updateOrdinal} {...this.props} />
        </React.Fragment>
      );
    }
    return (
      <React.Fragment>
        <div className="form-group row small-gutters mb-4">
          <div className="col type-toggle">{this.buildChartTypeToggle()}</div>
          <div className="col-auto">
            <div>{renderCodePopupAnchor(code, t(title))}</div>
          </div>
        </div>
        <div className="form-group row small-gutters mb-0">{filterMarkup}</div>
      </React.Fragment>
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
  t: PropTypes.func,
};

export default withTranslation("constants")(ColumnAnalysisFilters);
