import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import Select, { createFilter } from "react-select";

import { pivotAggs } from "../analysis/filters/Constants";

const aggregateAggs = t =>
  _.concat(pivotAggs(t), [{ value: "gmean", label: t("Geometric Mean", { ns: "constants" }) }]);

function validateAggregateCfg(cfg) {
  const { agg } = cfg ?? {};
  const { type, cols, func } = agg ?? {};
  if (type === "func" && _.isNil(func)) {
    return "Missing an aggregation selection!";
  } else if (type === "col" && !_.size(_.pickBy(cols || {}, v => _.size(v || [])))) {
    return "Missing an aggregation selection!";
  } else if (type === undefined) {
    return "Missing an aggregation selection!";
  }
  return null;
}

function buildCode({ index, columns, agg }) {
  if (_.isNil(agg)) {
    return null;
  }
  const { type, cols, func } = agg;
  let dfStr = index ? `df.groupby(['${_.join(_.map(index, "value"), "', '")}'])` : "df";
  const code = [];
  if (type === "func") {
    if (_.isNil(func)) {
      return null;
    }
    const isGmean = func.value === "gmean";
    if (isGmean) {
      code.push("from scipy.stats import gmean");
    }
    if (_.size(columns || [])) {
      dfStr = `${dfStr}['${_.join(_.map(columns, "value"), "', '")}']`;
    }
    code.push(isGmean ? `${dfStr}.apply(gmean)` : `${dfStr}.${func.value}()`);
  } else {
    if (_.isNil(cols)) {
      return null;
    }
    let aggStr = "${dfStr}.aggregate({";
    const aggFmt = agg => (agg === "gmean" ? "gmean" : `'${agg}'`);
    aggStr += _.join(
      _.map(cols || {}, (aggs, col) => `'${col}': ['${_.join(_.map(aggs || [], aggFmt), "', '")}']`),
      ", "
    );
    aggStr += "})";
    code.push(aggStr);
  }
  if (!index) {
    code[code.length - 1] = `${code[code.length - 1]}.to_frame().T`;
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
    let otherValues = _.pick(this.state, otherProps);
    otherValues = _.map(_.flatten(_.values(otherValues)), "value");
    otherValues = _.compact(otherValues);
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
    const { t } = this.props;
    const agg = _.get(this.state, "agg") || {};
    let input = null;
    if (agg.type === "col") {
      const addAgg = () => {
        const aggCols = _.assignIn({}, _.get(this.state, "agg.cols", {}));
        const currCol = _.get(this._curr_agg_col, "select.state.selectValue.0.value");
        const currAgg = _.get(this._curr_agg_func, "select.state.selectValue");
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
                <span className="pt-4 mr-4">{t("Col")}:</span>
                {this.renderSelect(null, "index", false, "_curr_agg_col")}
              </div>
            </div>
            <div className="col-md-7 pl-0">
              <div className="input-group">
                <span className="pt-4 mr-4">{t("Agg")}:</span>
                <Select
                  ref={r => (this._curr_agg_func = r)}
                  className="Select is-clearable is-searchable Select--single"
                  classNamePrefix="Select"
                  options={aggregateAggs(t)}
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
                <span className="mt-auto mb-auto mr-4">{t("Col")}:</span>
                <span className="font-weight-bold" style={{ minWidth: "10em" }}>
                  {col}
                </span>
              </div>
            </div>
            <div className="col pl-0">
              <div className="input-group">
                <span className="mt-auto mb-auto mr-4">{t("Func")}:</span>
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
              <span className="mt-auto mb-auto mr-4">{t("Func")}:</span>
              <Select
                className="Select is-clearable is-searchable Select--single"
                classNamePrefix="Select"
                options={aggregateAggs(t)}
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
              <span className="mt-auto mb-auto mr-4">{t("Cols:")}</span>
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
                    {t(label)}
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
        <label className="col-md-3 col-form-label text-right">{this.props.t("Column(s) to GroupBy")}</label>
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
  t: PropTypes.func,
};
const TranslateAggregate = withTranslation("reshape")(Aggregate);
export { TranslateAggregate as Aggregate, validateAggregateCfg, buildCode };
