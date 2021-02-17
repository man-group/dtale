import _ from "lodash";
import moment from "moment";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { DateInput } from "@blueprintjs/datetime";

import { buildRandomCode as buildCode } from "./codeSnippets";

require("@blueprintjs/core/lib/css/blueprint.css");
require("@blueprintjs/datetime/lib/css/blueprint-datetime.css");

export function validateRandomCfg(t, cfg) {
  const { type } = cfg;
  if (_.includes(["int", "float"], type)) {
    let { low, high } = cfg;
    low = parseInt(low);
    high = parseInt(high);
    if (!_.isNaN(low) && !_.isNaN(high) && low > high) {
      return t("Invalid range specification, low must be less than high!");
    }
  } else if (type === "date") {
    let { start, end } = cfg;
    start = moment(start);
    end = moment(end);
    if (start.isAfter(end)) {
      return t("Start must be before End!");
    }
  }
  return null;
}

class CreateRandom extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      type: "float",
      low: null,
      high: null,
      length: null,
      chars: null,
      choices: null,
      start: null,
      end: null,
      businessDay: false,
      timestamps: false,
    };
    this.updateState = this.updateState.bind(this);
    this.renderNumericInputs = this.renderNumericInputs.bind(this);
    this.renderStringInputs = this.renderStringInputs.bind(this);
    this.renderChoiceInputs = this.renderChoiceInputs.bind(this);
    this.renderDateInputs = this.renderDateInputs.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    let props = ["type", "low", "high"];
    switch (currState.type) {
      case "string":
        props = ["type", "chars", "length"];
        break;
      case "date":
        props = ["type", "start", "end", "businessDay", "timestamps"];
        break;
      case "choice":
        props = ["type", "choices"];
        break;
    }
    let cfg = _.pick(currState, props);
    cfg = _.pickBy(cfg, _.identity);
    if (cfg.type === "date") {
      cfg.start = _.isNull(cfg.start) ? null : moment(cfg.start).format("YYYYMMDD");
      cfg.end = _.isNull(cfg.end) ? null : moment(cfg.end).format("YYYYMMDD");
    }
    const updatedState = { cfg, code: buildCode(currState) };
    if (!this.props.namePopulated) {
      let nameIdx = 1;
      let name = `random_col${nameIdx}`;
      while (_.find(this.props.columns, { name })) {
        nameIdx++;
        name = `random_col${nameIdx}`;
      }
      updatedState.name = name;
    }
    this.setState(currState, () => this.props.updateState(updatedState));
  }

  renderNumericInputs() {
    const { t } = this.props;
    return [
      <div key={1} className="form-group row">
        <label className="col-md-3 col-form-label text-right">{t("Low")}</label>
        <div className="col-md-8">
          <input
            type="number"
            className="form-control"
            value={this.state.low || ""}
            onChange={e => this.updateState({ low: e.target.value })}
          />
          <small>{`${t("Default")}: 0`}</small>
        </div>
      </div>,
      <div key={2} className="form-group row">
        <label className="col-md-3 col-form-label text-right">{t("High")}</label>
        <div className="col-md-8">
          <input
            type="number"
            className="form-control"
            value={this.state.high || ""}
            onChange={e => this.updateState({ high: e.target.value })}
          />
          <small>{`${t("Default")}: ${this.state.type === "float" ? "1" : "100"}`}</small>
        </div>
      </div>,
    ];
  }

  renderStringInputs() {
    const { t } = this.props;
    return [
      <div key={1} className="form-group row">
        <label className="col-md-3 col-form-label text-right">{t("Length")}</label>
        <div className="col-md-8">
          <input
            type="number"
            className="form-control"
            value={this.state.length || ""}
            onChange={e => this.updateState({ length: e.target.value })}
          />
          <small>{`${t("Default")}: 10`}</small>
        </div>
      </div>,
      <div key={2} className="form-group row">
        <label className="col-md-3 col-form-label text-right">{t("Chars")}</label>
        <div className="col-md-8">
          <input
            type="text"
            className="form-control"
            value={this.state.chars || ""}
            onChange={e => this.updateState({ chars: e.target.value })}
          />
          <small>{`${t("Default")}: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'`}</small>
        </div>
      </div>,
    ];
  }

  renderChoiceInputs() {
    const { t } = this.props;
    return [
      <div key={1} className="form-group row">
        <label className="col-md-3 col-form-label text-right">{t("Choices")}</label>
        <div className="col-md-8">
          <input
            type="text"
            className="form-control"
            value={this.state.choices || ""}
            onChange={e => this.updateState({ choices: e.target.value })}
          />
          <small>{`${t("Default")}: 'a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z'`}</small>
        </div>
      </div>,
    ];
  }

  renderDateInputs() {
    const { t } = this.props;
    const { start, end } = this.state;
    const minDate = "19000101";
    const maxDate = "21991231";
    const inputProps = {
      formatDate: date => moment(date).format("YYYYMMDD"),
      parseDate: str => new Date(moment(str)),
      placeholder: "YYYYMMDD",
      popoverProps: { usePortal: false },
      minDate: new Date(moment(minDate)),
      maxDate: new Date(moment(maxDate)),
      showActionsBar: false,
    };
    return [
      <div key={1} className="form-group row mb-0">
        <label className="col-md-3 col-form-label text-right">{t("Range")}</label>
        <div className="col-md-3">
          <DateInput
            value={_.isNull(start) ? null : new Date(moment(start))}
            onChange={start => this.updateState({ start })}
            {...inputProps}
          />
          <small>{`(${t("Default")}: ${minDate})`}</small>
        </div>
        <div className="col-auto p-0">
          <span>{t("to")}</span>
        </div>
        <div className="col-md-3 text-left">
          <DateInput
            value={_.isNull(end) ? null : new Date(moment(end))}
            onChange={end => this.updateState({ end })}
            {...inputProps}
          />
          <small>{`(Default: ${maxDate})`}</small>
        </div>
      </div>,
      <div key={2} className="form-group row mb-0">
        <label className="col-md-3 col-form-label text-right">{t("Business Dates")}</label>
        <div className="col-md-8 mt-auto mb-auto">
          <i
            className={`ico-check-box${this.state.businessDay ? "" : "-outline-blank"} pointer`}
            onClick={() => this.updateState({ businessDay: !this.state.businessDay })}
          />
        </div>
      </div>,
      <div key={3} className="form-group row">
        <label className="col-md-3 col-form-label text-right">{t("Include Timestamps")}</label>
        <div className="col-md-8 mt-auto mb-auto">
          <i
            className={`ico-check-box${this.state.timestamps ? "" : "-outline-blank"} pointer`}
            onClick={() => this.updateState({ timestamps: !this.state.timestamps })}
          />
        </div>
      </div>,
    ];
  }

  render() {
    const { t } = this.props;
    let inputMarkup = null;
    switch (this.state.type) {
      case "string":
        inputMarkup = this.renderStringInputs();
        break;
      case "int":
      case "float":
        inputMarkup = this.renderNumericInputs();
        break;
      case "choice":
        inputMarkup = this.renderChoiceInputs();
        break;
      case "date":
        inputMarkup = this.renderDateInputs();
        break;
      case "bool":
      default:
        inputMarkup = null;
        break;
    }
    return _.concat(
      [
        <div key={0} className="form-group row">
          <label className="col-md-3 col-form-label text-right">{t("Data Type")}</label>
          <div className="col-md-8">
            <div className="btn-group">
              {_.map(["float", "int", "string", "choice", "bool", "date"], randType => {
                const buttonProps = { className: "btn btn-primary" };
                if (randType === this.state.type) {
                  buttonProps.className += " active";
                } else {
                  buttonProps.className += " inactive";
                  buttonProps.onClick = () => this.updateState({ type: randType });
                }
                return (
                  <button key={randType} {...buttonProps}>
                    {t(_.capitalize(randType))}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
      ],
      inputMarkup
    );
  }
}
CreateRandom.displayName = "CreateRandom";
CreateRandom.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
  namePopulated: PropTypes.bool,
  t: PropTypes.func,
};

export default withTranslation("builders")(CreateRandom);
