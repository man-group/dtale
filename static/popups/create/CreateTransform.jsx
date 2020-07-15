import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import Select, { createFilter } from "react-select";

import { AGGREGATION_OPTS } from "../charts/Aggregations";

function validateTransformCfg({ group, agg, col }) {
  if (!group) {
    return "Please select a group!";
  }
  if (!col) {
    return "Please select a column to transform!";
  }
  if (!agg) {
    return "Please select an aggregation!";
  }
  return null;
}

function buildCode({ group, agg, col }) {
  if (!col || !group || !agg) {
    return null;
  }

  return `df.groupby(['${_.join(group, "', '")}'])['${col}'].transform('${agg}')`;
}

class CreateTransform extends React.Component {
  constructor(props) {
    super(props);
    this.state = { group: null, col: null, agg: null };
    this.updateState = this.updateState.bind(this);
    this.renderSelect = this.renderSelect.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const cfg = {
      agg: _.get(currState, "agg.value") || null,
      col: _.get(currState, "col.value") || null,
      group: _.map(currState.group, "value") || null,
    };
    const code = buildCode(cfg);
    this.setState(currState, () => this.props.updateState({ cfg, code }));
  }

  renderSelect(label, prop, otherProps, isMulti = false) {
    const { columns } = this.props;
    let finalOptions = _.map(columns, "name");
    const otherValues = _(this.state).pick(otherProps).values().concat().map("value").compact().value();
    finalOptions = _.reject(finalOptions, otherValues);
    return (
      <div key={prop} className="form-group row">
        <label className="col-md-3 col-form-label text-right">{label}</label>
        <div className="col-md-8">
          <div className="input-group">
            <Select
              isMulti={isMulti}
              className="Select is-clearable is-searchable Select--single"
              classNamePrefix="Select"
              options={_.map(
                _.sortBy(finalOptions, o => _.toLower(o)),
                o => ({ value: o })
              )}
              getOptionLabel={_.property("value")}
              getOptionValue={_.property("value")}
              value={this.state[prop]}
              onChange={selected => this.updateState({ [prop]: selected })}
              isClearable
              filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
            />
          </div>
        </div>
      </div>
    );
  }

  render() {
    return [
      this.renderSelect("Group By", "group", "col", true),
      this.renderSelect("Col", "col", "group"),
      <div key={3} className="form-group row">
        <label className="col-md-3 col-form-label text-right">Aggregation</label>
        <div className="col-md-8">
          <div className="input-group">
            <Select
              className="Select is-clearable is-searchable Select--single"
              classNamePrefix="Select"
              options={_.reject(AGGREGATION_OPTS, { value: "rolling" })}
              getOptionLabel={_.property("label")}
              getOptionValue={_.property("value")}
              value={this.state.agg}
              onChange={agg => this.updateState({ agg })}
              isClearable
              filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
            />
          </div>
        </div>
      </div>,
    ];
  }
}
CreateTransform.displayName = "CreateTransform";
CreateTransform.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
};

export { CreateTransform, validateTransformCfg, buildCode };
