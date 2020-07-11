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
      ordinalCol: null,
      ordinalAgg: _.find(ANALYSIS_AGGS, { value: "sum" }),
    };
  }

  render() {
    const { cols, selectedCol } = this.props;
    const updateOrdinal = (prop, val) => this.setState({ [prop]: val }, () => this.props.updateOrdinal(prop, val));
    let colOpts = _.filter(cols, c => c.name !== selectedCol && _.includes(["float", "int"], gu.findColType(c.dtype)));
    colOpts = _.sortBy(
      _.map(colOpts, c => ({ value: c.name })),
      c => _.toLower(c.value)
    );
    return (
      <React.Fragment>
        <div className="col-auto text-center pr-4">
          <div>
            <b>Ordinal</b>
          </div>
          <div style={{ marginTop: "-.5em" }}>
            <small>(Choose Col/Agg)</small>
          </div>
        </div>
        <div className="col-auto pl-0 mr-3 ordinal-dd">
          <FilterSelect
            selectProps={{
              value: this.state.ordinalCol,
              options: colOpts,
              onChange: v => updateOrdinal("ordinalCol", v),
              noOptionsText: () => "No columns found",
              isClearable: true,
            }}
          />
        </div>
        <div className="col-auto pl-0 mr-3 ordinal-dd">
          <FilterSelect
            selectProps={{
              value: this.state.ordinalAgg,
              options: ANALYSIS_AGGS,
              onChange: v => updateOrdinal("ordinalAgg", v),
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
  updateOrdinal: PropTypes.func,
};

export default CategoryInputs;
