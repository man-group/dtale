import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import Select, { createFilter } from "react-select";

const AGGREGATION_OPTS = [
  { value: "count", label: "Count" },
  { value: "nunique", label: "Unique Count" },
  { value: "sum", label: "Sum" },
  { value: "mean", label: "Mean" },
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

function validatePivotCfg(cfg) {
  const { index, columns, values } = cfg;
  if (!_.size(index || [])) {
    return "Missing an index selection!";
  }
  if (!_.size(columns || [])) {
    return "Missing a columns selection!";
  }
  if (!_.size(values || [])) {
    return "Missing a value(s) selection!";
  }
  return null;
}

function buildCode({ index, columns, values, aggfunc }) {
  if (!_.size(index || []) || !_.size(columns || []) || !_.size(values || [])) {
    return null;
  }
  let code = "pd.pivot_table(df, ";
  const buildStr = vals => `['${_.join(_.map(vals, "value"), "', '")}']`;
  code += `index=${buildStr(index)}, columns=${buildStr(columns)}, values=${buildStr(values)}`;
  if (!_.isNull(aggfunc)) {
    code += `, aggfunc='${aggfunc.value}'`;
  }
  code += ")";
  return code;
}

class Pivot extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      shape: _.clone(props.columns),
      index: null,
      columns: null,
      values: null,
      aggfunc: _.find(AGGREGATION_OPTS, { value: "mean" }),
      columnNameHeaders: false,
    };
    this.renderSelect = this.renderSelect.bind(this);
    this.updateState = this.updateState.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const cfg = _.pick(currState, ["index", "columns", "values", "columnNameHeaders"]);
    const pickVals = vals => (_.size(vals) ? _.map(vals, "value") : null);
    cfg.index = pickVals(currState.index);
    cfg.columns = pickVals(currState.columns);
    cfg.values = pickVals(currState.values);
    cfg.aggfunc = _.get(currState, "aggfunc.value") || null;
    this.setState(currState, () => this.props.updateState({ cfg, code: buildCode(currState) }));
  }

  renderSelect(prop, otherProps, isMulti = false) {
    const { shape } = this.state;
    let finalOptions = _.map(shape, "name");
    const otherValues = _(this.state).pick(otherProps).values().flatten().map("value").compact().value();
    finalOptions = _.difference(finalOptions, otherValues);
    return (
      <Select
        isMulti={isMulti}
        className="Select is-clearable is-searchable Select--single"
        classNamePrefix="Select"
        options={_.map(finalOptions, o => ({ value: o }))}
        getOptionLabel={_.property("value")}
        getOptionValue={_.property("value")}
        value={this.state[prop]}
        onChange={selected => this.updateState({ [prop]: selected })}
        isClearable
        filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
      />
    );
  }

  render() {
    return [
      <div key={0} className="form-group row">
        <label className="col-md-3 col-form-label text-right">Rows</label>
        <div className="col-md-8">
          <div className="input-group">{this.renderSelect("index", ["columns", "values"], true)}</div>
        </div>
      </div>,
      <div key={1} className="form-group row">
        <label className="col-md-3 col-form-label text-right">Columns</label>
        <div className="col-md-8">
          <div className="input-group">{this.renderSelect("columns", ["index", "values"], true)}</div>
          <div className="row mb-0">
            <label className="col-auto col-form-label pr-3" style={{ fontSize: "85%" }}>
              {"Include Column Names in Headers?"}
            </label>
            <div className="col-auto p-0">
              <i
                className={`ico-check-box${this.state.columnNameHeaders ? "" : "-outline-blank"} pointer`}
                onClick={() =>
                  this.updateState({
                    columnNameHeaders: !this.state.columnNameHeaders,
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>,
      <div key={2} className="form-group row">
        <label className="col-md-3 col-form-label text-right">Value(s)</label>
        <div className="col-md-8">
          <div className="input-group">{this.renderSelect("values", ["index", "columns"], true)}</div>
        </div>
      </div>,
      <div key={3} className="form-group row">
        <label className="col-md-3 col-form-label text-right">Aggregation</label>
        <div className="col-md-8">
          <div className="input-group">
            <Select
              className="Select is-clearable is-searchable Select--single"
              classNamePrefix="Select"
              options={AGGREGATION_OPTS}
              getOptionLabel={_.property("label")}
              getOptionValue={_.property("value")}
              value={this.state.aggfunc}
              onChange={aggfunc => this.updateState({ aggfunc })}
              filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
            />
          </div>
        </div>
      </div>,
    ];
  }
}
Pivot.displayName = "Pivot";
Pivot.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
};

export { Pivot, validatePivotCfg, buildCode, AGGREGATION_OPTS };
