import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import ColumnSelect from "./ColumnSelect";

function parseRange(cfg) {
  let { start, end } = cfg;
  start = parseInt(start);
  end = parseInt(end);
  return { start, end };
}

export function validateSubstringCfg(t, cfg) {
  if (!cfg.col) {
    return t("Missing a column selection!");
  }
  const { start, end } = parseRange(cfg);
  if (_.isNaN(start) || _.isNaN(end) || start > end) {
    return t("Invalid range specification, start must be less than end!");
  }
  return null;
}

export function buildCode(cfg) {
  if (!cfg.col) {
    return null;
  }
  const { start, end } = parseRange(cfg);
  if (_.isNaN(start) || _.isNaN(end) || start > end) {
    return null;
  }
  if (start === 0) {
    return `df['${cfg.col}'].str[:${end}]`;
  }
  return `df['${cfg.col}'].str.slice(${start}, ${end})`;
}

class CreateSubstring extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      col: null,
      start: "0",
      end: "0",
    };
    this.updateState = this.updateState.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const props = ["start", "end"];
    let cfg = _.pick(currState, props);
    cfg = _.pickBy(cfg, _.identity);
    cfg = { ...cfg, ...parseRange(cfg) };
    cfg.col = _.get(currState, "col.value") || null;
    const updatedState = { cfg, code: buildCode(currState) };
    if (_.get(state, "col") && !this.props.namePopulated) {
      updatedState.name = `${updatedState.cfg.col}_substring`;
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
          <label className="col-md-3 col-form-label text-right">{t("Start")}</label>
          <div className="col-md-8">
            <input
              type="number"
              className="form-control"
              value={this.state.start || ""}
              onChange={e => this.updateState({ start: e.target.value })}
            />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">{t("End")}</label>
          <div className="col-md-8">
            <input
              type="number"
              className="form-control"
              value={this.state.end || ""}
              onChange={e => this.updateState({ end: e.target.value })}
            />
          </div>
        </div>
      </React.Fragment>
    );
  }
}
CreateSubstring.displayName = "CreateSubstring";
CreateSubstring.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
  namePopulated: PropTypes.bool,
  t: PropTypes.func,
};

export default withTranslation("builders")(CreateSubstring);
