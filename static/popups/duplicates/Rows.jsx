import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { BouncerWrapper } from "../../BouncerWrapper";
import { RemovableError } from "../../RemovableError";
import { buildURLString } from "../../actions/url-utils";
import { fetchJson } from "../../fetcher";
import ColumnSelect from "../create/ColumnSelect";
import Keep from "./Keep";

function validateRowsCfg(cfg) {
  const { subset } = cfg;
  if (!_.size(subset || [])) {
    return "Missing a column selection!";
  }
  return null;
}

function buildCfg(state) {
  const cfg = _.pick(state, ["keep", "subset"]);
  cfg.subset = _.map(cfg.subset, "value") || null;
  return cfg;
}

class Rows extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      keep: "first",
      subset: props.selectedCol ? [{ value: props.selectedCol }] : null,
      testOutput: null,
      loadingTest: false,
    };
    this.updateState = this.updateState.bind(this);
    this.test = this.test.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    this.setState(currState, () => this.props.updateState({ cfg: buildCfg(currState) }));
  }

  test() {
    const { t } = this.props;
    this.setState({ loadingTest: true });
    const cfg = buildCfg(this.state);
    const params = {
      type: "rows",
      cfg: JSON.stringify(cfg),
      action: "test",
    };
    fetchJson(buildURLString(`/dtale/duplicates/${this.props.dataId}?`, params), testData => {
      if (testData.error) {
        this.setState({
          testOutput: <RemovableError {...testData} />,
          loadingTest: false,
        });
        return;
      }
      let testOutput = `${t("No duplicate rows exist for the column(s)")}: ${_.join(cfg.subset, ", ")}`;
      if (testData.results) {
        testOutput = (
          <React.Fragment>
            <span className="pr-3">{t("From")}</span>
            <b>{testData.results.total}</b>
            <span className="pl-3">{` ${t("rows")}:`}</span>
            <ul>
              <li>
                <b>{testData.results.removed}</b>
                {t(" duplicate rows will be removed")}
              </li>
              <li>
                <b>{testData.results.remaining}</b>
                {t(" rows will remain")}
              </li>
            </ul>
          </React.Fragment>
        );
      }
      this.setState({ testOutput, loadingTest: false });
    });
  }

  render() {
    const { t } = this.props;
    return (
      <React.Fragment>
        <Keep value={this.state.keep} updateState={this.updateState} />
        <ColumnSelect
          label={t("Column(s)")}
          prop="subset"
          parent={this.state}
          updateState={this.updateState}
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
              <BouncerWrapper showBouncer={this.state.loadingTest}>{this.state.testOutput || ""}</BouncerWrapper>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}
Rows.displayName = "Rows";
Rows.propTypes = {
  dataId: PropTypes.string,
  updateState: PropTypes.func,
  columns: PropTypes.array,
  selectedCol: PropTypes.string,
  t: PropTypes.func,
};
const TranslateRows = withTranslation("duplicate")(Rows);
export { TranslateRows as Rows, validateRowsCfg };
