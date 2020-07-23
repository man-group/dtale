import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import Select, { createFilter } from "react-select";

import { AGGREGATION_OPTS } from "./Pivot";

function validateAggregateCfg(cfg) {
  const { index, agg } = cfg;
  if (!_.size(index || [])) {
    return "Missing an index selection!";
  }
  const { type, cols, func } = agg;
  if (type === "func" && _.isNil(func)) {
    return "Missing an aggregation selection!";
  } else if (type === "col" && !_.size(_.pickBy(cols || {}, v => _.size(v || [])))) {
    return "Missing an aggregation selection!";
  }
  return null;
}

function buildCode({ index, columns, agg }) {
  if (!_.size(index || []) || _.isNil(agg)) {
    return null;
  }
  const { type, cols, func } = agg;
  let code = `df.groupby(['${_.join(_.map(index, "value"), "', '")}'])`;
  if (type === "func") {
    if (_.isNil(func)) {
      return null;
    }
    if (_.size(columns || [])) {
      code = `df.groupby(['${_.join(_.map(index, "value"), "', '")}'])['${_.join(_.map(columns, "value"), "', '")}']`;
    }
    code += `.${func.value}()`;
  } else {
    if (_.isNil(cols)) {
      return null;
    }
    code += ".aggregate({";
    code += _.join(
      _.map(cols || {}, (aggs, col) => `'${col}': ['${_.join(aggs || [], "', '")}']`),
      ", "
    );
    code += "})";
  }
  return code;
}

class Aggregate extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      shape: _.clone(props.columns),
      index: null,
      columns: null,
      agg: { type: "col" },
    };
    this.updateState = this.updateState.bind(this);
    this.renderSelect = this.renderSelect.bind(this);
    this.renderAggregation = this.renderAggregation.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const cfg = _.pick(currState, ["index"]);
    const { agg } = currState;
    cfg.agg = _.get(currState, "agg.value") || null;
    if (_.size(currState.index)) {
      cfg.index = _.map(currState.index, "value");
    } else {
      cfg.index = null;
    }
    const aggCfg = { type: agg.type };
    if (agg.type === "col") {
      aggCfg.cols = _.pickBy(agg.cols, v => _.size(v || []));
    } else {
      aggCfg.func = _.get(agg, "func.value", null);
      aggCfg.cols = _.map(this.state.columns || [], "value");
    }
    cfg.agg = aggCfg;
    this.setState(currState, () => this.props.updateState({ cfg, code: buildCode(currState) }));
  }

  renderSelect(prop, otherProps, isMulti = false, ref = null) {
    const { shape } = this.state;
    let finalOptions = _.map(shape, "name");
    const otherValues = _(this.state).pick(otherProps).values().flatten().map("value").compact().value();
    finalOptions = _.difference(finalOptions, otherValues);
    const props = {
      isMulti,
      value: this.state[prop],
      onChange: selected => this.updateState({ [prop]: selected }),
    };
    if (ref) {
      props.ref = r => (this[ref] = r);
      delete props.value;
      delete props.onChange;
    }
    return (
      <Select
        {...props}
        className="Select is-clearable is-searchable Select--single"
        classNamePrefix="Select"
        options={_.map(finalOptions, o => ({ value: o }))}
        getOptionLabel={_.property("value")}
        getOptionValue={_.property("value")}
        isClearable
        filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
      />
    );
  }

  renderAggregation() {
    const agg = _.get(this.state, "agg") || {};
    let input = null;
    if (agg.type === "col") {
      const addAgg = () => {
        const aggCols = _.assignIn({}, _.get(this.state, "agg.cols", {}));
        const currCol = _.get(this._curr_agg_col.select.state.selectValue, "0.value");
        const currAgg = this._curr_agg_func.select.state.selectValue;
        if (!currCol || !currAgg) {
          return;
        }
        aggCols[currCol] = _.map(currAgg || [], "value");
        this._curr_agg_col.select.clearValue();
        this.updateState({
          agg: _.assign({}, this.state.agg, { cols: aggCols }),
        });
      };
      const removeAgg = col => () => {
        this.updateState({
          agg: _.assign({}, this.state.agg, {
            cols: _.omit(_.get(this.state, "agg.cols", {}), col),
          }),
        });
      };
      input = _.concat(
        [
          <div key={0} className="row pb-4">
            <div className="col-md-5 pr-2">
              <div className="input-group mr-3 col-agg-col-input">
                <span className="pt-4 mr-4">Col:</span>
                {this.renderSelect(null, "index", false, "_curr_agg_col")}
              </div>
            </div>
            <div className="col-md-7 pl-0">
              <div className="input-group">
                <span className="pt-4 mr-4">Agg:</span>
                <Select
                  ref={r => (this._curr_agg_func = r)}
                  className="Select is-clearable is-searchable Select--single"
                  classNamePrefix="Select"
                  options={AGGREGATION_OPTS}
                  getOptionLabel={_.property("label")}
                  getOptionValue={_.property("value")}
                  isClearable
                  isMulti
                  filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
                />
                <i className="ico-add-circle pointer mt-auto mb-auto ml-4" onClick={addAgg} />
              </div>
            </div>
          </div>,
        ],
        _.map(_.get(this.state, "agg.cols", {}), (aggs, col) => (
          <div key={`saved-agg-${col}`} className="row">
            <div className="col-auto pr-2">
              <div className="input-group mr-3 col-agg-col-input">
                <span className="mt-auto mb-auto mr-4">Col:</span>
                <span className="font-weight-bold" style={{ minWidth: "10em" }}>
                  {col}
                </span>
              </div>
            </div>
            <div className="col pl-0">
              <div className="input-group">
                <span className="mt-auto mb-auto mr-4">Func:</span>
                <span className="font-weight-bold w-100">{_.join(aggs, ", ")}</span>
                <i className="ico-remove-circle pointer mt-auto mb-auto ml-4" onClick={removeAgg(col)} />
              </div>
            </div>
          </div>
        ))
      );
    } else {
      input = (
        <div key={0} className="row pb-4">
          <div className="col-auto pr-2">
            <div className="input-group mr-3 col-agg-col-input">
              <span className="mt-auto mb-auto mr-4">Func:</span>
              <Select
                className="Select is-clearable is-searchable Select--single"
                classNamePrefix="Select"
                options={AGGREGATION_OPTS}
                getOptionLabel={_.property("label")}
                getOptionValue={_.property("value")}
                value={_.get(this.state.agg, "func", null)}
                onChange={agg =>
                  this.updateState({
                    agg: _.assign({}, this.state.agg, { func: agg }),
                  })
                }
                isClearable
                filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
              />
            </div>
          </div>
          <div className="col pl-0">
            <div className="input-group">
              <span className="mt-auto mb-auto mr-4">Cols:</span>
              {this.renderSelect("columns", "index", true)}
            </div>
          </div>
        </div>
      );
    }
    return (
      <div key={2} className="form-group row">
        <div className="col-md-3 text-right mb-auto mt-3">
          <div className="btn-group agg-types">
            {_.map(
              [
                ["col", "By Column"],
                ["func", "By Function"],
              ],
              ([val, label]) => {
                const buttonProps = { className: "btn" };
                if (val === agg.type) {
                  buttonProps.className += " btn-primary active";
                } else {
                  buttonProps.className += " btn-primary inactive";
                  buttonProps.onClick = () =>
                    this.updateState({
                      agg: _.assign({}, this.state.agg, { type: val }),
                    });
                }
                return (
                  <button key={`agg-${val}`} {...buttonProps}>
                    {label}
                  </button>
                );
              }
            )}
          </div>
        </div>
        <div className="col-md-8">{input}</div>
      </div>
    );
  }

  render() {
    return [
      <div key={0} className="form-group row">
        <label className="col-md-3 col-form-label text-right">Column(s) to GroupBy</label>
        <div className="col-md-8">
          <div className="input-group">{this.renderSelect("index", ["columns"], true)}</div>
        </div>
      </div>,
      this.renderAggregation(),
    ];
  }
}
Aggregate.displayName = "Aggregate";
Aggregate.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
};

export { Aggregate, validateAggregateCfg, buildCode };
