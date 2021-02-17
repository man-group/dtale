import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { BouncerWrapper } from "../../BouncerWrapper";
import { RemovableError } from "../../RemovableError";
import { buildURLString } from "../../actions/url-utils";
import { fetchJson } from "../../fetcher";
import ColumnSelect from "../create/ColumnSelect";

function validateShowDuplicatesCfg(cfg) {
  const { group } = cfg;
  if (!_.size(group || [])) {
    return "Missing a group selection!";
  }
  return null;
}

function buildCfg(state) {
  const cfg = _.pick(state, ["group", "filter"]);
  cfg.group = _.map(cfg.group, "value") || null;
  if (cfg.filter) {
    cfg.filter = state.testOutput.results[cfg.filter].filter;
  }
  return cfg;
}

class ShowDuplicates extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      group: null,
      filter: null,
      testOutput: null,
      loadingTest: false,
    };
    this.updateState = this.updateState.bind(this);
    this.test = this.test.bind(this);
    this.renderTestOutput = this.renderTestOutput.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    this.setState(currState, () => this.props.updateState({ cfg: buildCfg(currState) }));
  }

  test() {
    this.setState({ loadingTest: true });
    const params = {
      type: "show",
      cfg: JSON.stringify(buildCfg(this.state)),
      action: "test",
    };
    fetchJson(buildURLString(`/dtale/duplicates/${this.props.dataId}?`, params), testOutput => {
      this.setState({ testOutput, loadingTest: false, filter: null });
    });
  }

  renderTestOutput() {
    const { t } = this.props;
    const { testOutput } = this.state;
    const cfg = buildCfg(this.state);
    if (testOutput === null) {
      return null;
    }
    if (testOutput.error) {
      return <RemovableError {...testOutput} />;
    }
    if (_.size(testOutput.results)) {
      return (
        <React.Fragment>
          <span>{`${t("Duplicates exist for the following")} (${_.join(cfg.group, ", ")}) ${t("groups")}:`}</span>
          <br />
          <b>Total Duplicates</b>
          {`: ${_.sum(_.map(testOutput.results, "count"))}`}
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            <ul>
              {_.map(_.keys(testOutput.results), (group, i) => (
                <li key={i}>
                  {_.size(testOutput.results) > 1 && (
                    <i
                      className={`ico-check-box${this.state.filter == group ? "" : "-outline-blank"} pointer pb-2 pr-3`}
                      onClick={() =>
                        this.updateState({
                          filter: this.state.filter === group ? null : group,
                        })
                      }
                    />
                  )}
                  <b>{group}</b>
                  {`: ${testOutput.results[group].count}`}
                </li>
              ))}
            </ul>
          </div>
        </React.Fragment>
      );
    }
    return `${t("No duplicates exist in any of the")} (${_.join(cfg.group, ", ")}) ${t("groups")}`;
  }

  render() {
    const { t } = this.props;
    return (
      <React.Fragment>
        <ColumnSelect
          label={t("Column(s)")}
          prop="group"
          parent={this.state}
          updateState={state => this.updateState({ ...state, filter: null })}
          columns={this.props.columns}
          isMulti
        />
        <div className="form-group row">
          <div className="col-md-3" />
          <div className="col-md-8">
            <button className="col-auto btn btn-secondary" onClick={this.test}>
              {t("View Duplicates")}
            </button>
          </div>
        </div>
        <div className="form-group row">
          <div className="col-md-3" />
          <div className="col-md-8">
            <div className="input-group d-block">
              <BouncerWrapper showBouncer={this.state.loadingTest}>{this.renderTestOutput()}</BouncerWrapper>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}
ShowDuplicates.displayName = "ShowDuplicates";
ShowDuplicates.propTypes = {
  dataId: PropTypes.string,
  updateState: PropTypes.func,
  columns: PropTypes.array,
  t: PropTypes.func,
};
const TranslateShowDuplicates = withTranslation("duplicate")(ShowDuplicates);
export { TranslateShowDuplicates as ShowDuplicates, validateShowDuplicatesCfg };
