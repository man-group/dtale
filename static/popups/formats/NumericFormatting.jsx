import getSymbolFromCurrency from "currency-symbol-map";
import currencyToSymbolMap from "currency-symbol-map/map";
import _ from "lodash";
import numeral from "numeral";
import PropTypes from "prop-types";
import React from "react";
import Modal from "react-bootstrap/Modal";
import { withTranslation } from "react-i18next";
import Select, { createFilter } from "react-select";

import menuFuncs from "../../dtale/menu/dataViewerMenuUtils";

const STYLE_PROPS = ["redNegs", "currency"];

function buildFormatter(fmt = { precision: 2 }) {
  const { precision, thousands, abbreviate, exponent, bps, currency } = fmt;
  let fmtStr = "0";
  if (thousands) {
    fmtStr = "0,000";
  }
  if (currency) {
    fmtStr = `${getSymbolFromCurrency(currency.value)}${fmtStr}`;
  }
  if (precision) {
    fmtStr += `.${_.repeat(0, precision)}`;
  }
  if (abbreviate) {
    fmtStr += "a";
  }
  if (exponent) {
    fmtStr += "e+0";
  }
  if (bps) {
    fmtStr += "BPS";
  }
  const style = _.pick(fmt, STYLE_PROPS);
  style.currency = _.get(style.currency, "value");
  return { fmt: fmtStr, style };
}

function buildCurrencyOpt(currency) {
  return {
    value: currency,
    label: `${currency} (${currencyToSymbolMap[currency]})`,
  };
}

function parseState({ fmt, style }) {
  const parsedState = {
    precision: null,
    thousands: _.startsWith(fmt, "0,000"),
    abbreviate: _.includes(fmt, "a"),
    exponent: _.includes(fmt, "e+0"),
    bps: _.includes(fmt, "BPS"),
    redNegs: _.get(style, "redNegs", false),
    currency: _.get(style, "currency") ? buildCurrencyOpt(style.currency) : null,
    fmt,
  };
  if (_.includes(fmt, ".")) {
    let precision = 0;
    const precisionStr = _.last(fmt.split("."));
    while (_.get(precisionStr, precision) === "0") {
      precision++;
    }
    parsedState.precision = precision;
  }
  return parsedState;
}

const BASE_STATE = {
  precision: null,
  thousands: false,
  abbreviate: false,
  exponent: false,
  bps: false,
  redNegs: false,
  currency: null,
  fmt: "",
};

class NumericFormatting extends React.Component {
  constructor(props) {
    super(props);
    let state = _.assign({}, BASE_STATE);
    if (_.has(this.props.columnFormats, this.props.selectedCol)) {
      state = parseState(this.props.columnFormats[this.props.selectedCol]);
    }
    this.state = state;
    this.updateState = this.updateState.bind(this);
    this.buildSimpleToggle = this.buildSimpleToggle.bind(this);
  }

  updateState(state) {
    const updatedState = _.assignIn({}, this.state, state);
    const fmt = buildFormatter(updatedState);
    this.setState(_.assignIn(updatedState, fmt), () => this.props.updateState(fmt));
  }

  buildSimpleToggle(prop, label) {
    return (
      <div className="form-group row">
        <label className="col-md-4 col-form-label text-right">{this.props.t(label)}</label>
        <div className="col-md-6">
          <div className="btn-group">
            {_.map([true, false], (val, i) => {
              const buttonProps = { className: "btn" };
              if (val === this.state[prop]) {
                buttonProps.className += " btn-primary active";
              } else {
                buttonProps.className += " btn-primary inactive";
                buttonProps.onClick = () => this.updateState({ [prop]: val });
              }
              return (
                <button key={i} {...buttonProps}>
                  {this.props.t(val ? "On" : "Off")}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { t } = this.props;
    const exampleNum = -123456.789;
    let exampleOutput = this.state.fmt ? numeral(exampleNum).format(this.state.fmt) : exampleNum;
    exampleOutput = <span style={menuFuncs.buildStyling(exampleNum, "float", this.state)}>{exampleOutput}</span>;
    return (
      <Modal.Body>
        <div className="form-group row">
          <label className="col-md-4 col-form-label text-right">{t("Precision")}</label>
          <div className="col-md-6">
            <div className="btn-group">
              {_.map(_.range(7), precision => {
                const buttonProps = { className: "btn" };
                if (precision === this.state.precision) {
                  buttonProps.className += " btn-primary active";
                } else {
                  buttonProps.className += " btn-primary inactive";
                  buttonProps.onClick = () => this.updateState({ precision });
                }
                return (
                  <button key={precision} {...buttonProps}>
                    {precision}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {this.buildSimpleToggle("thousands", "Thousands Separator")}
        {this.buildSimpleToggle("abbreviate", "Abbreviate")}
        {this.buildSimpleToggle("exponent", "Exponent")}
        {this.buildSimpleToggle("bps", "BPS")}
        {this.buildSimpleToggle("redNegs", "Red Negatives")}
        <div className="form-group row">
          <label className="col-md-4 col-form-label text-right">{t("Currency")}</label>
          <div className="col-md-6">
            <Select
              className="Select is-clearable is-searchable Select--single"
              classNamePrefix="Select"
              options={_.map(_.sortBy(_.keys(currencyToSymbolMap)), buildCurrencyOpt)}
              getOptionLabel={_.property("label")}
              getOptionValue={_.property("value")}
              value={this.state.currency}
              onChange={currency => this.updateState({ currency })}
              isClearable
              filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
            />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-md-4 col-form-label text-right">
            <span>{t("Numeral.js Format")}</span>
            <i
              style={{ cursor: "help" }}
              className="ico-info-outline pl-5"
              onClick={e => {
                e.preventDefault();
                window.open(
                  "http://numeraljs.com/#format",
                  null,
                  "titlebar=1,location=1,status=1,width=990,height=450"
                );
              }}
            />
          </label>
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              value={this.state.fmt}
              onChange={event => this.updateState({ fmt: event.target.value })}
            />
          </div>
        </div>
        <div className="row text-center">
          <small className="col-md-10">
            {`${t("EX")}: ${exampleNum} => `}
            {exampleOutput}
          </small>
        </div>
      </Modal.Body>
    );
  }
}
NumericFormatting.displayName = "NumericFormatting";
NumericFormatting.propTypes = {
  updateState: PropTypes.func,
  columnFormats: PropTypes.object,
  selectedCol: PropTypes.string,
  t: PropTypes.func,
};

export default withTranslation("formatting")(NumericFormatting);
