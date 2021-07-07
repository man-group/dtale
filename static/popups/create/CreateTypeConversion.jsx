import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import Select, { createFilter } from "react-select";

import * as gu from "../../dtale/gridUtils";
import buildCode from "./typeConversionCodeUtils";

const TYPE_MAP = {
  string: ["date", "int", "float", "bool", "category"],
  int: ["date", "float", "bool", "category", "str", "hex"],
  float: ["int", "str", "hex"],
  date: ["int", "str"],
  bool: ["int", "str"],
  category: ["int", "bool", "str"],
};

export function getDtype(col, columns) {
  return gu.getDtype(_.get(col, "value"), columns);
}

function getColType(col, columns) {
  const dtype = getDtype(col, columns);
  const colType = gu.findColType(dtype);
  if (colType === "unknown") {
    return dtype;
  }
  return colType;
}

function isMixed(colType) {
  return _.startsWith(colType, "mixed");
}

function getConversions(col, columns) {
  const colType = getColType(col, columns);
  if (isMixed(colType)) {
    return [_.without(TYPE_MAP.string, "int"), colType];
  }
  return [_.get(TYPE_MAP, colType, []), colType];
}

export function validateTypeConversionCfg(t, cfg) {
  const { col, to, from, unit } = cfg;
  if (_.isNull(col)) {
    return t("Missing a column selection!");
  }
  if (_.isNull(to)) {
    return t("Missing a conversion selection!");
  }
  const colType = gu.findColType(from);
  if ((colType === "int" && to === "date") || (colType === "date" && to === "int")) {
    if (_.isNull(unit)) {
      return t("Missing a unit selection!");
    }
    if (colType === "date" && to === "int" && _.includes(["D", "s", "us", "ns"], unit)) {
      return t("Invalid unit selection, valid options are 'YYYYMMDD' or 'ms'");
    }
  }
  return null;
}

class CreateTypeConversion extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      col: null,
      conversion: null,
      fmt: null,
      unit: null,
      applyAllType: false,
    };
    this.updateState = this.updateState.bind(this);
    this.renderConversions = this.renderConversions.bind(this);
    this.renderConversionInputs = this.renderConversionInputs.bind(this);
  }

  componentDidMount() {
    const prePopulatedCol = _.get(this.props, "prePopulated.col");
    if (prePopulatedCol) {
      this.updateState({ col: { value: prePopulatedCol } });
    }
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const cfg = _.pick(currState, ["col", "fmt", "unit"]);
    cfg.to = currState.conversion;
    cfg.from = getDtype(cfg.col, this.props.columns);
    cfg.col = _.get(currState, "col.value") || null;
    cfg.unit = _.get(currState, "unit.value") || null;
    cfg.applyAllType = this.state.applyAllType;
    this.setState(currState, () => this.props.updateState({ cfg, code: buildCode(cfg) }));
  }

  renderConversions() {
    if (this.state.col) {
      const [conversions, dtype] = getConversions(this.state.col, this.props.columns);
      let input = null;
      if (_.size(conversions)) {
        input = (
          <div className="btn-group">
            {_.map(conversions, conversion => {
              const buttonProps = { className: "btn btn-primary" };
              if (conversion === this.state.conversion) {
                buttonProps.className += " active";
              } else {
                buttonProps.className += " inactive";
                buttonProps.onClick = () => this.updateState({ conversion });
              }
              return (
                <button key={conversion} {...buttonProps}>
                  {this.props.t(_.capitalize(conversion))}
                </button>
              );
            })}
          </div>
        );
      } else {
        input = (
          <span>
            {`${this.props.t("No conversion mappings available for dtype")}:`}
            <b className="pl-3">{dtype}</b>
          </span>
        );
      }
      return (
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">{this.props.t("Convert To")}</label>
          <div className="col-md-8">{input}</div>
        </div>
      );
    }
    return null;
  }

  renderConversionInputs() {
    if (_.isNull(this.state.col)) {
      return null;
    }
    const colType = getColType(this.state.col, this.props.columns);
    const { conversion } = this.state;
    if ((colType === "string" && conversion === "date") || (colType === "date" && conversion == "date")) {
      return (
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">{this.props.t("Date Format")}</label>
          <div className="col-md-8">
            <input
              type="text"
              className="form-control"
              value={this.state.fmt || "%Y%m%d"}
              onChange={e => this.updateState({ fmt: e.target.value })}
            />
          </div>
        </div>
      );
    }
    if ((colType === "int" && conversion === "date") || (colType === "date" && conversion === "int")) {
      const units = colType === "int" ? ["YYYYMMDD", "D", "s", "ms", "us", "ns"] : ["YYYYMMDD", "ms"];
      return (
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">{this.props.t("Unit/Format")}</label>
          <div className="col-md-8">
            <div className="input-group">
              <Select
                className="Select is-clearable is-searchable Select--single"
                classNamePrefix="Select"
                options={_.map(units, u => ({ value: u }))}
                getOptionLabel={_.property("value")}
                getOptionValue={_.property("value")}
                value={this.state.unit}
                onChange={selected => this.updateState({ unit: selected })}
                isClearable
                filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
              />
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  render() {
    const { t } = this.props;
    const colType = getDtype(this.state.col, this.props.columns);
    const prePopulatedCol = _.get(this.props, "prePopulated.col");
    return (
      <React.Fragment>
        {!prePopulatedCol && (
          <div className="form-group row">
            <label className="col-md-3 col-form-label text-right">{t("Column To Convert")}</label>
            <div className="col-md-8">
              <div className="input-group">
                <Select
                  className="Select is-clearable is-searchable Select--single"
                  classNamePrefix="Select"
                  options={_.sortBy(
                    _.map(this.props.columns, c => ({ value: c.name })),
                    o => _.toLower(o.value)
                  )}
                  getOptionLabel={_.property("value")}
                  getOptionValue={_.property("value")}
                  value={this.state.col}
                  onChange={selected => this.updateState({ col: selected, conversion: null })}
                  noOptionsText={() => "No columns found"}
                  isClearable
                  filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
                />
              </div>
            </div>
          </div>
        )}
        {this.renderConversions()}
        {this.renderConversionInputs()}
        {isMixed(colType) && (
          <div className="form-group row">
            <div className={`col-md-${prePopulatedCol ? "1" : "3"}`} />
            <div className={`col-md-${prePopulatedCol ? "10" : "8"} mt-auto mb-auto`}>
              <label className="col-form-label text-right pr-3">
                {`${t("Apply Conversion to all columns of type")} "${colType}"?`}
              </label>
              <i
                className={`ico-check-box${this.state.applyAllType ? "" : "-outline-blank"} pointer`}
                onClick={() => this.updateState({ applyAllType: !this.state.applyAllType })}
              />
            </div>
          </div>
        )}
      </React.Fragment>
    );
  }
}
CreateTypeConversion.displayName = "CreateTypeConversion";
CreateTypeConversion.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
  prePopulated: PropTypes.object,
  t: PropTypes.func,
};

export default withTranslation("builders")(CreateTypeConversion);
