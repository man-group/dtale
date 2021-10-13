import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import Select, { createFilter } from "react-select";

import { RemovableError } from "../../RemovableError";
import * as gu from "../../dtale/gridUtils";
import { pivotAggs } from "../analysis/filters/Constants";

function validateValueCfg(cfgs) {
  if (!_.size(cfgs)) {
    return "Please add (+) a replacement!";
  }
  return null;
}

function validateCfg(t, { type, value, replace }, cfgs) {
  if (_.isNull(value) || "") {
    return t("Please select a value to search for!");
  }
  if (_.isNull(type)) {
    return t("Please select a type of replacement!");
  }
  if (_.isNull(replace) || "") {
    if (type === "raw") {
      return t("Please enter a raw value!");
    } else if (type === "col") {
      return t("Please select a column!");
    }
    return t("Please select an aggregation!");
  }
  if (type === "raw" && _.find(cfgs, { type: "raw", value })) {
    return `${t("A replacement for")} ${value} ${t("already exists, please remove it before adding this one!")}`;
  }
  return null;
}

function valConverter(val, colType, quote = "'") {
  if (_.toLower(val) === "nan") {
    return "np.nan";
  } else if (colType === "string") {
    return `${quote}${val}${quote}`;
  }
  return val;
}

function buildCode(col, colType, cfg) {
  let code = [`s = df['${col}']`];
  const replacements = [];
  const colReplacements = [];
  _.forEach(cfg, ({ type, value, replace }) => {
    if (_.isNull(value)) {
      return;
    }
    const valStr = valConverter(value, colType);
    if (type === "agg") {
      replacements.push(`\t${valStr}: getattr(df['${col}'], '${replace}')(),`);
    } else if (type === "raw") {
      replacements.push(`\t${valStr}: ${valConverter(replace, colType)},`);
    } else {
      colReplacements.push(`s = np.where(s == ${valStr}, data['${replace}'], s)`);
    }
  });
  if (_.size(replacements)) {
    code.push("s = s.replace({");
    code = _.concat(code, replacements);
    code.push("})");
  }
  if (_.size(colReplacements)) {
    code = _.concat(code, colReplacements);
  }
  if (_.size(code) === 1) {
    return null;
  }
  return code;
}

const BASE_STATE = {
  value: "nan",
  col: null,
  raw: null,
  agg: null,
  type: "raw",
};

class Value extends React.Component {
  constructor(props) {
    super(props);
    this.state = { ...BASE_STATE, cfgs: [] };
    this.addCfg = this.addCfg.bind(this);
    this.removeCfg = this.removeCfg.bind(this);
    this.renderCfg = this.renderCfg.bind(this);
  }

  addCfg() {
    const { type, value } = this.state;
    let replace;
    let finalVal = value;
    if (finalVal !== "nan" && this.props.colType === "float") {
      finalVal = parseFloat(finalVal);
    } else if (finalVal !== "nan" && this.props.colType === "int") {
      finalVal = parseInt(finalVal);
    }
    if (type === "col") {
      replace = _.get(this.state, "col.value") || null;
    } else if (type === "raw") {
      replace = this.state.raw;
      if (replace !== "nan" && this.props.colType === "float") {
        replace = parseFloat(replace);
      } else if (replace !== "nan" && this.props.colType === "int") {
        replace = parseInt(replace);
      }
    } else {
      replace = _.get(this.state, "agg.value") || null;
    }
    const newCfg = { type, value: finalVal, replace };
    const error = validateCfg(newCfg, this.state.cfgs);
    if (error) {
      this.props.updateState({ error: <RemovableError error={error} /> });
      return;
    }
    const currCfgs = [...this.state.cfgs, newCfg];
    const code = buildCode(this.props.col, this.props.colType, currCfgs);
    const cfg = { value: currCfgs };
    this.setState({ ...BASE_STATE, cfgs: currCfgs }, () => this.props.updateState({ error: null, cfg, code }));
  }

  removeCfg(idx) {
    this.setState({ cfgs: _.filter(this.state.cfgs, (_cfg, i) => i !== idx) });
  }

  renderCfg() {
    const { t } = this.props;
    return _.map(this.state.cfgs, ({ type, value, replace }, i) => {
      let replaceStr;
      if (type === "raw") {
        replaceStr = valConverter(replace, this.props.colType, `"`);
      } else if (type === "col") {
        replaceStr = `${t("replacement:values from column")} "${replace}"`;
      } else {
        replaceStr = `${t("replacement:the")} ${replace} ${t("replacement:of column")} "${this.props.col}"`;
      }
      return (
        <div key={i + 2} className="row">
          <div className="col-md-3" />
          <div className="col-md-8">
            <i className="ico-remove-circle pointer mt-auto mb-auto mr-4" onClick={() => this.removeCfg(i)} />
            <span>
              {t("replacement:Search for ")}
              <b>{valConverter(value, this.props.colType, `"`)}</b>
              {t("replacement: and replace it with ")}
              <b>{replaceStr}</b>
            </span>
          </div>
        </div>
      );
    });
  }

  render() {
    const { col, colType } = this.props;
    let filterTypes = [colType];
    if (_.includes(["int", "float"], colType)) {
      filterTypes = ["int", "float"];
    }
    const { type } = this.state;
    let input = null;
    const addBtn = <i className="ico-add-circle pointer mt-auto mb-auto ml-4" onClick={this.addCfg} />;
    if (type === "col") {
      const columns = _.map(
        _.filter(this.props.columns || [], c => _.includes(filterTypes, gu.findColType(c.dtype))),
        ({ name }) => ({ value: name })
      );
      const finalOptions = _.reject(columns, { value: col });
      input = (
        <div className="input-group">
          <Select
            className="Select is-clearable is-searchable Select--single"
            classNamePrefix="Select"
            options={_.sortBy(finalOptions, o => _.toLower(o.value))}
            getOptionLabel={_.property("value")}
            getOptionValue={_.property("value")}
            value={this.state.col}
            onChange={selected => this.setState({ col: selected })}
            noOptionsText={() => "No columns found"}
            isClearable
            filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
          />
          {addBtn}
        </div>
      );
    } else if (type === "raw") {
      input = [
        <div key="raw-0" className="input-group">
          <input
            type="text"
            className="form-control numeric-input"
            value={this.state.raw || ""}
            onChange={e => this.setState({ raw: e.target.value })}
          />
          {addBtn}
        </div>,
        <small key="raw-1">{this.props.t("replacement:replace_missings")}</small>,
      ];
    } else {
      input = (
        <div className="input-group">
          <Select
            className="Select is-clearable is-searchable Select--single"
            classNamePrefix="Select"
            options={pivotAggs(this.props.t)}
            getOptionLabel={_.property("value")}
            getOptionValue={_.property("value")}
            value={this.state.agg}
            onChange={selected => this.setState({ agg: selected })}
            isClearable
            filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
          />
          {addBtn}
        </div>
      );
    }
    return _.concat(
      [
        <div key={0} className="form-group row">
          <label className="col-md-3 col-form-label text-right">
            {this.props.t("Search For", { ns: "replacement" })}
          </label>
          <div className="col-md-8">
            <input
              type="text"
              className="form-control"
              value={this.state.value || ""}
              onChange={e => this.setState({ value: e.target.value })}
            />
            <small>{this.props.t("replacement:replace_missings")}</small>
          </div>
        </div>,
        <div key={1} className="form-group row">
          <label className="col-md-3 col-form-label text-right">
            {this.props.t("Replace With", { ns: "replacement" })}
          </label>
          <div className="col-md-8">
            <div className="row">
              <div className="col-auto btn-group" style={{ height: "fit-content" }}>
                {_.map(["raw", "agg", "col"], t => {
                  const buttonProps = { className: "btn" };
                  if (t === type) {
                    buttonProps.className += " btn-primary active";
                  } else {
                    buttonProps.className += " btn-primary inactive";
                    buttonProps.onClick = () => this.setState({ type: t });
                  }
                  return (
                    <button key={`type-${t}`} {...buttonProps}>
                      {this.props.t(_.capitalize(t), { ns: "replacement" })}
                    </button>
                  );
                })}
              </div>
              <div className="col">{input}</div>
            </div>
          </div>
        </div>,
      ],
      this.renderCfg()
    );
  }
}
Value.displayName = "Value";
Value.propTypes = {
  updateState: PropTypes.func,
  col: PropTypes.string,
  columns: PropTypes.array,
  colType: PropTypes.string,
  t: PropTypes.func,
};
const TranslateValue = withTranslation(["replacement", "constant"])(Value);
export { TranslateValue as Value, validateValueCfg, buildCode };
