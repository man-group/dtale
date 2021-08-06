import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import ColumnSelect from "./ColumnSelect";

export function validateReplaceCfg(t, cfg) {
  if (!cfg.col) {
    return t("Missing a column selection!");
  }
  if (!cfg.search) {
    return t("You must enter a substring to search for!");
  }
  if (!cfg.replacement) {
    return t("You must enter a replacement!");
  }
  return null;
}

export function buildCode({ col, search, replacement, caseSensitive, regex }) {
  if (!col || !search || !replacement) {
    return null;
  }
  let code = `df['${col}'].str.replace('${search}', '${replacement}'`;
  if (caseSensitive) {
    code += `, case=True`;
  }
  if (regex) {
    code += `, regex=True`;
  }
  return code + ")";
}

class CreateReplace extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      col: null,
      search: "",
      replacement: "",
      caseSensitive: false,
      regex: false,
    };
    this.updateState = this.updateState.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const props = ["search", "replacement", "caseSensitive", "regex"];
    const cfg = _.pick(currState, props);
    cfg.col = _.get(currState, "col.value") || null;
    const updatedState = { cfg, code: buildCode(cfg) };
    if (_.get(state, "col") && !this.props.namePopulated) {
      updatedState.name = `${updatedState.cfg.col}_replace`;
    }
    this.setState(currState, () => this.props.updateState(updatedState));
  }

  render() {
    const { t } = this.props;
    return (
      <React.Fragment>
        <ColumnSelect
          label={`${t("Column")}*`}
          prop="col"
          parent={this.state}
          updateState={this.updateState}
          columns={this.props.columns}
          dtypes={["string"]}
        />
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">{t("Search For")}</label>
          <div className="col-md-8">
            <input
              type="text"
              className="form-control"
              value={this.state.search || ""}
              onChange={e => this.updateState({ search: e.target.value })}
            />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">{t("Replacement")}</label>
          <div className="col-md-8">
            <input
              type="text"
              className="form-control"
              value={this.state.replacement || ""}
              onChange={e => this.updateState({ replacement: e.target.value })}
            />
          </div>
        </div>
        <div className="form-group row mb-0">
          <label className="col-md-3 col-form-label text-right">{t("Case Sensitive")}</label>
          <div className="col-md-8 mt-auto mb-auto">
            <i
              className={`ico-check-box${this.state.caseSensitive ? "" : "-outline-blank"} pointer`}
              onClick={() => this.updateState({ caseSensitive: !this.state.caseSensitive })}
            />
          </div>
        </div>
        <div className="form-group row mb-0">
          <label className="col-md-3 col-form-label text-right">{t("Regex")}</label>
          <div className="col-md-8 mt-auto mb-auto">
            <i
              className={`ico-check-box${this.state.regex ? "" : "-outline-blank"} pointer`}
              onClick={() => this.updateState({ regex: !this.state.regex })}
            />
          </div>
        </div>
      </React.Fragment>
    );
  }
}
CreateReplace.displayName = "CreateReplace";
CreateReplace.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
  namePopulated: PropTypes.bool,
  t: PropTypes.func,
};

export default withTranslation("builders")(CreateReplace);
