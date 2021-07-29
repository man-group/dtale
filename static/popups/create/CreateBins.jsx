import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { BinsTester } from "./BinsTester";
import ColumnSelect from "./ColumnSelect";

export function validateBinsCfg(t, cfg) {
  const { col, bins, labels } = cfg;
  if (_.isNull(col)) {
    return t("Missing a column selection!");
  }
  if (bins === "") {
    return t("Missing a bins selection!");
  }
  if (!_.isNull(labels) && _.size(labels.split(",")) != parseInt(bins)) {
    const labelCt = _.size(labels.split(","));
    return `${t("There are")} ${bins} ${t("bins, but you have only specified")} ${labelCt} labels!`;
  }
  return null;
}

export function buildCode({ col, operation, bins, labels }) {
  if (_.isNull(col)) {
    return null;
  }
  let code = `pd.${operation}(df['${col.value}'], `;
  if (_.isNull(bins) || bins === "" || parseInt(bins) < 1) {
    return null;
  }
  code += `${operation === "cut" ? "bins" : "q"}=${bins}`;
  if (!_.isNull(labels)) {
    if (_.size(labels.split(",")) != parseInt(bins)) {
      return null;
    }
    code += `, labels=['${_.join(labels.split(","), "', '")}']`;
  }
  code += ")";
  return code;
}

function buildCfg(state) {
  const cfg = _.pick(state, ["operation", "bins", "labels"]);
  cfg.col = _.get(state, "col.value") || null;
  return cfg;
}

class CreateBins extends React.Component {
  constructor(props) {
    super(props);
    this.state = { col: null, operation: "cut", bins: "", labels: null };
    this.updateState = this.updateState.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const updatedState = {
      cfg: buildCfg(currState),
      code: buildCode(currState),
    };
    if (_.get(state, "col") && !this.props.namePopulated) {
      updatedState.name = `${updatedState.cfg.col}_bins`;
    }
    this.setState(currState, () => this.props.updateState(updatedState));
  }

  render() {
    const { t } = this.props;
    const cfg = buildCfg(this.state);
    return (
      <div className="row">
        <div className="col-md-8 pr-0">
          <ColumnSelect
            label={t("Column")}
            prop="col"
            parent={this.state}
            updateState={this.updateState}
            columns={this.props.columns}
            dtypes={["int", "float"]}
          />
          <div key={1} className="form-group row">
            <label className="col-md-3 col-form-label text-right">{t("Operation")}</label>
            <div className="col-md-8">
              <div className="btn-group">
                {_.map(
                  [
                    ["cut", "Cut (Evenly Spaced)"],
                    ["qcut", "Qcut (Evenly Sized)"],
                  ],
                  ([operation, label]) => {
                    const buttonProps = { className: "btn btn-primary" };
                    if (operation === this.state.operation) {
                      buttonProps.className += " active";
                    } else {
                      buttonProps.className += " inactive";
                      buttonProps.onClick = () => this.updateState({ operation });
                    }
                    return (
                      <button key={operation} {...buttonProps}>
                        {t(label)}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>
          <div key={2} className="form-group row">
            <label className="col-md-3 col-form-label text-right">{t("Bins")}</label>
            <div className="col-md-8">
              <input
                type="number"
                className="form-control"
                value={this.state.bins}
                onChange={e => this.updateState({ bins: e.target.value })}
              />
            </div>
          </div>
          <div key={3} className="form-group row">
            <label className="col-md-3 col-form-label text-right">{t("Labels")}</label>
            <div className="col-md-8">
              <input
                type="text"
                className="form-control"
                value={this.state.labels || ""}
                onChange={e => this.updateState({ labels: e.target.value })}
              />
            </div>
          </div>
        </div>
        <div className="col-md-4 pl-0">
          <BinsTester valid={validateBinsCfg(t, cfg) === null} cfg={cfg} />
        </div>
      </div>
    );
  }
}
CreateBins.displayName = "CreateBins";
CreateBins.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
  namePopulated: PropTypes.bool,
  t: PropTypes.func,
};
export default withTranslation("builders")(CreateBins);
