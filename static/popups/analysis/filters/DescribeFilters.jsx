import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { GlobalHotKeys } from "react-hotkeys";
import { withTranslation } from "react-i18next";

import ButtonToggle from "../../../ButtonToggle";
import * as gu from "../../../dtale/gridUtils";
import { renderCodePopupAnchor } from "../../CodePopup";
import CategoryInputs from "./CategoryInputs";
import { analysisAggs, titles } from "./Constants";
import FilterSelect from "./FilterSelect";
import { default as GeoFilters, hasCoords, loadCoordVals } from "./GeoFilters";
import OrdinalInputs from "./OrdinalInputs";
import TextEnterFilter from "./TextEnterFilter";

function wrapFilterMarkup(filterMarkup) {
  return (
    <div className="form-group row small-gutters mb-3 mt-3">
      <div className="row m-0">{filterMarkup}</div>
    </div>
  );
}

function buildState(props) {
  return {
    type: "boxplot",
    bins: "20",
    top: (props.top || 100) + "",
    ordinalCol: null,
    ordinalAgg: _.find(analysisAggs(props.t), { value: "sum" }),
    categoryCol: null,
    categoryAgg: _.find(analysisAggs(props.t), { value: "mean" }),
    ...loadCoordVals(props.selectedCol, props.cols),
    target: null,
  };
}

class DescribeFilters extends React.Component {
  constructor(props) {
    super(props);
    this.state = buildState(props);
    this.buildChart = this.buildChart.bind(this);
    this.buildChartTypeToggle = this.buildChartTypeToggle.bind(this);
    this.buildFilter = this.buildFilter.bind(this);
    this.buildGeoFilter = this.buildGeoFilter.bind(this);
    this.updateOrdinal = this.updateOrdinal.bind(this);
    this.updateCategory = this.updateCategory.bind(this);
    this.buildChartOptions = this.buildChartOptions.bind(this);
    this.updateChartType = this.updateChartType.bind(this);
    this.toggleLeft = this.toggleLeft.bind(this);
    this.toggleRight = this.toggleRight.bind(this);
    this.targetSelect = this.targetSelect.bind(this);
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

  buildChartOptions() {
    const { dtype, cols, selectedCol, t } = this.props;
    const colType = gu.findColType(dtype);
    const translatedTitles = titles(t);
    const options = [{ label: translatedTitles.boxplot, value: "boxplot" }];
    const isFid = _.includes(["float", "int", "date"], colType);
    if (isFid) {
      options.push({ label: translatedTitles.histogram, value: "histogram" });
    }
    if (colType === "float") {
      options.push({ label: translatedTitles.categories, value: "categories" });
    } else if (colType == "string") {
      options.push({
        label: translatedTitles.word_value_counts,
        value: "word_value_counts",
      });
      options.push({
        label: translatedTitles.value_counts,
        value: "value_counts",
      });
    } else {
      options.push({
        label: translatedTitles.value_counts,
        value: "value_counts",
      });
    }
    if (hasCoords(selectedCol, cols)) {
      options.push({
        label: translatedTitles.geolocation,
        value: "geolocation",
      });
    }
    if (isFid) {
      options.push({ label: translatedTitles.qq, value: "qq" });
    }
    return options;
  }

  updateChartType(type) {
    this.setState({ type }, this.buildChart);
  }

  toggleLeft() {
    const { type } = this.state;
    const options = this.buildChartOptions();
    const selectedIndex = _.findIndex(options, { value: type });
    if (selectedIndex > 0) {
      this.updateChartType(options[selectedIndex - 1].value);
    }
  }

  toggleRight() {
    const { type } = this.state;
    const options = this.buildChartOptions();
    const selectedIndex = _.findIndex(options, { value: type });
    if (selectedIndex < _.size(options) - 1) {
      this.updateChartType(options[selectedIndex + 1].value);
    }
  }

  buildChartTypeToggle() {
    return (
      <>
        <GlobalHotKeys
          keyMap={{ LEFT: "left", RIGHT: "right" }}
          handlers={{ LEFT: this.toggleLeft, RIGHT: this.toggleRight }}
        />
        <ButtonToggle options={this.buildChartOptions()} update={this.updateChartType} defaultValue={this.state.type} />
        <small className="d-block pl-4 pt-3">({this.props.t("constants:navigate")})</small>
      </>
    );
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

  buildGeoFilter() {
    const { selectedCol, cols } = this.props;
    const { latCol, lonCol } = this.state;
    const update = val => this.setState(val, this.buildChart);
    return <GeoFilters col={selectedCol} columns={cols} {...{ latCol, lonCol, update }} />;
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

  targetSelect() {
    const { cols, selectedCol, t } = this.props;
    let colOpts = _.reject(cols, { name: selectedCol });
    colOpts = _.sortBy(
      _.map(colOpts, c => ({ value: c.name })),
      c => _.toLower(c.value)
    );
    return (
      <React.Fragment key="target">
        <div className="col-auto text-center pr-4">
          <div>
            <b>{t("Target")}</b>
          </div>
          <div style={{ marginTop: "-.5em" }}>
            <small>{`(${t("Choose Col")})`}</small>
          </div>
        </div>
        <div className="col-auto pl-0 mr-3 ordinal-dd">
          <FilterSelect
            selectProps={{
              value: this.state.target,
              options: colOpts,
              onChange: target => this.setState({ target }, this.buildChart),
              noOptionsText: () => this.props.t("No columns found"),
              isClearable: true,
            }}
          />
        </div>
      </React.Fragment>
    );
  }

  render() {
    if (_.isNull(this.props.type)) {
      return null;
    }
    const { code, dtype } = this.props;
    const colType = gu.findColType(dtype);
    let filterMarkup = null;
    if (this.state.type === "boxplot" || this.state.type === "qq") {
      filterMarkup = null;
    } else if (this.state.type === "geolocation") {
      filterMarkup = wrapFilterMarkup(this.buildGeoFilter());
    } else if ("int" === colType) {
      // int -> Value Counts or Histogram
      if (this.state.type === "histogram") {
        filterMarkup = wrapFilterMarkup([this.buildFilter("bins"), this.targetSelect()]);
      } else {
        filterMarkup = wrapFilterMarkup([
          this.buildFilter("top"),
          <OrdinalInputs key="ordinal" colType={colType} updateOrdinal={this.updateOrdinal} {...this.props} />,
        ]);
      }
    } else if ("float" === colType) {
      // floats -> Histogram or Categories
      if (this.state.type === "histogram") {
        filterMarkup = wrapFilterMarkup([this.buildFilter("bins"), this.targetSelect()]);
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
        <OrdinalInputs key="ordinal" colType={colType} updateOrdinal={this.updateOrdinal} {...this.props} />,
      ]);
    }
    return (
      <React.Fragment>
        <div className="form-group row small-gutters mb-5 mt-3">
          <div className="col p-0 type-toggle">{this.buildChartTypeToggle()}</div>
          <div className="col-auto">
            <div>{renderCodePopupAnchor(code, titles(this.props.t)[this.state.type])}</div>
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
  t: PropTypes.func,
};

export default withTranslation("constants")(DescribeFilters);
