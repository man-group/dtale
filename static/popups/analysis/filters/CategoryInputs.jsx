import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import { exports as gu } from "../../../dtale/gridUtils";
import { AGGREGATION_OPTS } from "../../charts/Aggregations";
import FilterSelect from "./FilterSelect";

const ANALYSIS_AGGS = _.concat(AGGREGATION_OPTS, [{ value: "pctsum", label: "Percentage Sum" }]);

class CategoryInputs extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      categoryCol: null,
      categoryAgg: _.find(ANALYSIS_AGGS, { value: "mean" }),
    };
  }

  render() {
    const { cols, selectedCol } = this.props;
    const updateCategory = (prop, val) => this.setState({ [prop]: val }, () => this.props.updateCategory(prop, val));
    let colOpts = _.reject(cols, c => c.name === selectedCol || gu.findColType(c.dtype) === "float");
    colOpts = _.sortBy(
      _.map(colOpts, c => ({ value: c.name })),
      c => _.toLower(c.value)
    );
    return (
      <React.Fragment>
        <div className="col-auto text-center pr-4">
          <div>
            <b>Category Breakdown</b>
          </div>
          <div style={{ marginTop: "-.5em" }}>
            <small>(Choose Col/Agg)</small>
          </div>
        </div>
        <div className="col-auto pl-0 mr-3 ordinal-dd">
          <FilterSelect
            selectProps={{
              value: this.state.categoryCol,
              options: colOpts,
              onChange: v => updateCategory("categoryCol", v),
              noOptionsText: () => "No columns found",
              isClearable: true,
            }}
          />
        </div>
        <div className="col-auto pl-0 mr-3 ordinal-dd">
          <FilterSelect
            selectProps={{
              value: this.state.categoryAgg,
              options: ANALYSIS_AGGS,
              onChange: v => updateCategory("categoryAgg", v),
            }}
            labelProp="label"
          />
        </div>
      </React.Fragment>
    );
  }
}
CategoryInputs.displayName = "CategoryInputs";
CategoryInputs.propTypes = {
  selectedCol: PropTypes.string,
  cols: PropTypes.array,
  updateCategory: PropTypes.func,
};

export default CategoryInputs;
