import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import Select, { createFilter } from "react-select";

import { isDateCol } from "../../dtale/gridUtils";

const AGGREGATION_OPTS = [
  { value: "count", label: "Count" },
  { value: "nunique", label: "Unique Count" },
  { value: "sum", label: "Sum" },
  { value: "mean", label: "Mean" },
  { value: "rolling", label: "Rolling" },
  { value: "first", label: "First" },
  { value: "last", label: "Last" },
  { value: "median", label: "Median" },
  { value: "min", label: "Minimum" },
  { value: "max", label: "Maximum" },
  { value: "std", label: "Standard Deviation" },
  { value: "var", label: "Variance" },
  { value: "mad", label: "Mean Absolute Deviation" },
  { value: "prod", label: "Product of All Items" },
];

function getAggregations({ columns, x, group }) {
  if (isDateCol(_.get(_.find(columns, { name: _.get(x, "value") }), "dtype", "")) && _.isEmpty(group)) {
    return AGGREGATION_OPTS;
  }
  return _.reject(AGGREGATION_OPTS, { value: "rolling" });
}

const ROLLING_COMPS = [
  { value: "corr", label: "Correlation" },
  { value: "count", label: "Count" },
  { value: "cov", label: "Covariance" },
  { value: "kurt", label: "Kurtosis" },
  { value: "max", label: "Maximum" },
  { value: "mean", label: "Mean" },
  { value: "median", label: "Median" },
  { value: "min", label: "Minimum" },
  { value: "skew", label: "Skew" },
  { value: "std", label: "Standard Deviation" },
  { value: "sum", label: "Sum" },
  { value: "var", label: "Variance" },
];

class Aggregations extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      aggregation: props.aggregation ? _.find(AGGREGATION_OPTS, { value: props.aggregation }) : null,
      rollingComputation: null,
      rollingWindow: "4",
    };
    this.update = this.update.bind(this);
    this.renderRolling = this.renderRolling.bind(this);
  }

  update(val, upperVal) {
    this.setState(val, () => this.props.propagateState(upperVal));
  }

  renderRolling() {
    if (_.get(this.state, "aggregation.value") === "rolling") {
      const { rollingWindow, rollingComputation } = this.state;
      return [
        <span key={2} className="mb-auto mt-auto">
          Window:
        </span>,
        <div key={3} className="col-auto">
          <input
            style={{ width: "3em" }}
            className="form-control input-sm"
            type="text"
            value={rollingWindow || ""}
            onChange={e =>
              this.update(
                { rollingWindow: _.get(e, "target.value", "") },
                { rollingWindow: _.get(e, "target.value", "") }
              )
            }
          />
        </div>,
        <span key={4} className="mb-auto mt-auto">
          Computation:
        </span>,
        <div key={5} className="col-auto">
          <div className="input-group mr-3">
            <Select
              className="Select is-clearable is-searchable Select--single"
              classNamePrefix="Select"
              options={ROLLING_COMPS}
              getOptionLabel={_.property("label")}
              getOptionValue={_.property("value")}
              value={rollingComputation}
              onChange={rollingComputation =>
                this.update({ rollingComputation }, { rollingComputation: _.get(rollingComputation, "value") })
              }
              isClearable
              filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
            />
          </div>
        </div>,
        <div key={6} className="col" />,
      ];
    }
    return <div key={2} className="col" />;
  }

  render() {
    return [
      <span key={0} className="mb-auto mt-auto">
        Aggregation:
      </span>,
      <div key={1} className="col-auto">
        <div className="input-group mr-3">
          <Select
            className="Select is-clearable is-searchable Select--single"
            classNamePrefix="Select"
            options={getAggregations(this.props)}
            getOptionLabel={_.property("label")}
            getOptionValue={_.property("value")}
            value={this.state.aggregation}
            onChange={aggregation => this.update({ aggregation }, { aggregation: _.get(aggregation, "value") })}
            isClearable
            filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
          />
        </div>
      </div>,
      this.renderRolling(),
    ];
  }
}
Aggregations.displayName = "Aggregations";
Aggregations.propTypes = {
  propagateState: PropTypes.func,
  columns: PropTypes.arrayOf(PropTypes.object), // eslint-disable-line react/no-unused-prop-types
  x: PropTypes.object, // eslint-disable-line react/no-unused-prop-types
  group: PropTypes.arrayOf(PropTypes.object), // eslint-disable-line react/no-unused-prop-types
  aggregation: PropTypes.string, // eslint-disable-line react/no-unused-prop-types
};

export { Aggregations, AGGREGATION_OPTS, ROLLING_COMPS };
