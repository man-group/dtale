import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import Select, { createFilter } from "react-select";

import { exports as gu } from "../../dtale/gridUtils";

const TYPE_MAP = {
  string: ["date", "int", "float", "bool", "category"],
  int: ["date", "float", "bool", "category", "str"],
  float: ["int", "str"],
  date: ["int", "str"],
  bool: ["int", "str"],
  category: ["int", "bool", "str"],
};

function getDtype(col, columns) {
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

function validateTypeConversionCfg(cfg) {
  const { col, to, from, unit } = cfg;
  if (_.isNull(col)) {
    return "Missing a column selection!";
  }
  if (_.isNull(to)) {
    return "Missing a conversion selection!";
  }
  const colType = gu.findColType(from);
  if ((colType === "int" && to === "date") || (colType === "date" && to === "int")) {
    if (_.isNull(unit)) {
      return "Missing a unit selection!";
    }
    if (colType === "date" && to === "int" && _.includes(["D", "s", "us", "ns"], unit)) {
      return "Invalid unit selection, valid options are 'YYYYMMDD' or 'ms'";
    }
  }
  return null;
}

function buildMixedCode(s, to, standardConv) {
  if (to === "float") {
    return `pd.to_numeric(${s}, errors="coerce")`;
  } else if (to === "bool") {
    return [
      "import numpy as np",
      "bool_map = dict(true=True, false=False)",
      `${s}.apply(lambda b: bool_map.get(str(b).lower(), np.nan)`,
    ];
  }
  return standardConv;
}

function buildCode({ col, from, to, fmt, unit }) {
  if (_.isNull(col) || _.isNull(to)) {
    return null;
  }
  const s = `df['${col}']`;
  const classifier = gu.findColType(from);
  const standardConv = `${s}.astype('${to}')`;
  if (classifier === "string") {
    // date, int, float, bool, category
    if (to === "date") {
      const kwargs = fmt ? `format='${fmt}'` : "infer_datetime_format=True";
      return `pd.to_datetime(${s}, ${kwargs})`;
    } else if (to === "int") {
      return `${s}.astype('float').astype('int')`;
    } else if (to === "float") {
      return `pd.to_numeric(${s}, errors="coerce")`;
    }
    return standardConv;
  } else if (classifier === "int") {
    // date, float, category, str, bool
    if (to === "date") {
      if (unit === "YYYYMMDD") {
        return `${s}.astype(str).apply(pd.Timestamp)`;
      } else {
        return `pd.to_datetime(${s}, unit='${unit || "D"}')`;
      }
    }
    return standardConv;
  } else if (classifier === "date") {
    // str, int
    if (to === "int") {
      if (unit === "YYYYMMDD") {
        return `pd.Series(${s}.dt.strftime('%Y%m%d').astype(int)`;
      }
      return ["import time", `${s}.apply(lambda x: time.mktime(x.timetuple())).astype(int)`];
    }
    return `pd.Series(${s}.dt.strftime('${fmt}')`;
  } else if (_.includes(["float", "bool"], classifier)) {
    return standardConv;
  } else if (_.startsWith(from, "mixed")) {
    return buildMixedCode(s, to, standardConv);
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
                  {_.capitalize(conversion)}
                </button>
              );
            })}
          </div>
        );
      } else {
        input = (
          <span>
            No conversion mappings available for dtype:
            <b className="pl-3">{dtype}</b>
          </span>
        );
      }
      return (
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">Convert To</label>
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
          <label className="col-md-3 col-form-label text-right">Date Format</label>
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
          <label className="col-md-3 col-form-label text-right">Unit/Format</label>
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
    const colType = getDtype(this.state.col, this.props.columns);
    const prePopulatedCol = _.get(this.props, "prePopulated.col");
    return (
      <React.Fragment>
        {!prePopulatedCol && (
          <div className="form-group row">
            <label className="col-md-3 col-form-label text-right">Column To Convert</label>
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
                {`Apply Conversion to all columns of type "${colType}"?`}
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
};

export { CreateTypeConversion, validateTypeConversionCfg, buildCode };
