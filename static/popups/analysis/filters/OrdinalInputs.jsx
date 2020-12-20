import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import { exports as gu } from "../../../dtale/gridUtils";
import { CLEANERS } from "../../create/CreateCleaning";
import { AGGREGATION_OPTS } from "./Constants";
import FilterSelect from "./FilterSelect";

const ANALYSIS_AGGS = _.concat(AGGREGATION_OPTS, [{ value: "pctsum", label: "Percentage Sum" }]);
const CLEANER_OPTS = _.concat(
  [{ value: "underscore_to_space", label: "Replace underscores w/ space" }],
  _.filter(CLEANERS, "word_count")
);

class OrdinalInputs extends React.Component {
  constructor(props) {
    super(props);
    const { type } = props;
    const hiddenChars = _.find(CLEANER_OPTS, { value: "hidden_chars" });
    this.state = {
      ordinalCol: null,
      ordinalAgg: _.find(ANALYSIS_AGGS, { value: "sum" }),
      cleaners: type === "word_value_counts" || type === "value_counts" ? [{ ...hiddenChars }] : [],
    };
    this.updateOrdinal = this.updateOrdinal.bind(this);
    this.renderCleaners = this.renderCleaners.bind(this);
  }

  updateOrdinal(prop, val) {
    this.setState({ [prop]: val }, () => this.props.updateOrdinal(prop, val));
  }

  renderCleaners() {
    const { type } = this.props;
    if (type === "word_value_counts" || type === "value_counts") {
      return (
        <div className="row pt-3" data-tip="Clean column of extraneous values">
          <div className="col-auto text-center pr-4 ml-auto mt-auto mb-auto">
            <b>Cleaner</b>
          </div>
          <div className="col pl-0 mr-3 ordinal-dd cleaner-dd">
            <FilterSelect
              selectProps={{
                value: this.state.cleaners,
                options: CLEANER_OPTS,
                onChange: v => this.updateOrdinal("cleaners", v),
                isClearable: true,
                isMulti: true,
              }}
              labelProp="label"
            />
          </div>
        </div>
      );
    }
    return null;
  }

  render() {
    const { cols, selectedCol } = this.props;
    let colOpts = _.filter(cols, c => c.name !== selectedCol && _.includes(["float", "int"], gu.findColType(c.dtype)));
    colOpts = _.sortBy(
      _.map(colOpts, c => ({ value: c.name })),
      c => _.toLower(c.value)
    );
    return (
      <div className="col">
        <div className="row">
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
                onChange: v => this.updateOrdinal("ordinalCol", v),
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
                onChange: v => this.updateOrdinal("ordinalAgg", v),
              }}
              labelProp="label"
            />
          </div>
        </div>
        {this.renderCleaners()}
      </div>
    );
  }
}
OrdinalInputs.displayName = "OrdinalInputs";
OrdinalInputs.propTypes = {
  selectedCol: PropTypes.string,
  cols: PropTypes.array,
  updateOrdinal: PropTypes.func,
  type: PropTypes.string,
};

export default OrdinalInputs;
