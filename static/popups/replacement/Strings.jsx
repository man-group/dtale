import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

function validateStringsCfg(t, cfg) {
  const { value, replace } = cfg;
  if (_.isNull(value)) {
    return t("Please enter a character or substring!");
  }
  if (_.isNull(replace) || "") {
    return t("Please enter a replacement value!");
  }
  return null;
}

function buildCode(col, colType, { value, isChar, ignoreCase, replace }) {
  if (_.isNull(value)) {
    return null;
  }
  let flags = "re.UNICODE";
  if (ignoreCase) {
    flags += " | re.IGNORECASE";
  }
  let valStr = `' + re.escape('${value}') + '`;
  if (isChar) {
    valStr = `[${valStr}]+`;
  }

  let replaceVal = replace;
  if (_.toLower(replaceVal) === "nan") {
    replaceVal = "np.nan";
  } else if (colType === "string") {
    replaceVal = `'${replaceVal}'`;
  }

  return [
    "import re",
    "",
    `regex_pat = re.compile(r'^ *${valStr} *$', flags=${flags})`,
    `df.loc[:, '${col}'] = df['${col}'].replace(regex_pat, ${replaceVal}, regex=True)`,
  ];
}

class Strings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: null,
      isChar: false,
      ignoreCase: false,
      replace: null,
    };
    this.updateState = this.updateState.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const cfg = _.pick(currState, ["value", "isChar", "ignoreCase", "replace"]);
    this.setState(currState, () =>
      this.props.updateState({
        cfg,
        code: buildCode(this.props.col, this.props.colType, currState),
      })
    );
  }

  render() {
    return [
      <div key={0} className="form-group row mb-0">
        <label className="col-md-3 col-form-label text-right">{this.props.t("Search For")}</label>
        <div className="col-md-8">
          <input
            type="text"
            className="form-control"
            value={this.state.value || ""}
            onChange={e => this.updateState({ value: e.target.value })}
          />
        </div>
      </div>,
      <div key={1} className="form-group row mb-0">
        <label className="col-md-3 col-form-label text-right">{this.props.t("Is Character?")}</label>
        <div className="col-md-8 mt-auto mb-auto">
          <i
            className={`ico-check-box${this.state.isChar ? "" : "-outline-blank"} pointer`}
            onClick={() => this.updateState({ isChar: !this.state.isChar })}
          />
        </div>
      </div>,
      <div key={2} className="form-group row mb-0">
        <label className="col-md-3 col-form-label text-right">{this.props.t("Ignore case?")}</label>
        <div className="col-md-8 mt-auto mb-auto">
          <i
            className={`ico-check-box${this.state.ignoreCase ? "" : "-outline-blank"} pointer`}
            onClick={() => this.updateState({ ignoreCase: !this.state.ignoreCase })}
          />
        </div>
      </div>,
      <div key={3} className="form-group row">
        <label className="col-md-3 col-form-label text-right">{this.props.t("Replace With")}</label>
        <div className="col-md-8">
          <input
            type="text"
            className="form-control"
            value={this.state.replace || ""}
            onChange={e => this.updateState({ replace: e.target.value })}
          />
          <small>{this.props.t("replace_missings")}</small>
        </div>
      </div>,
    ];
  }
}
Strings.displayName = "Strings";
Strings.propTypes = {
  updateState: PropTypes.func,
  col: PropTypes.string,
  colType: PropTypes.string,
  t: PropTypes.func,
};
const TranslateStrings = withTranslation("replacement")(Strings);
export { TranslateStrings as Strings, validateStringsCfg, buildCode };
