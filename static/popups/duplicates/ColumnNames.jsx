import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { BouncerWrapper } from "../../BouncerWrapper";
import { RemovableError } from "../../RemovableError";
import { buildURLString } from "../../actions/url-utils";
import { fetchJson } from "../../fetcher";
import Keep from "./Keep";

function validateColumnNamesCfg(_cfg) {
  return null;
}

class ColumnNames extends React.Component {
  constructor(props) {
    super(props);
    this.state = { keep: "first", testOutput: null, loadingTest: false };
    this.updateState = this.updateState.bind(this);
    this.test = this.test.bind(this);
  }

  componentDidMount() {
    this.props.updateState({ cfg: _.pick(this.state, ["keep"]) });
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const cfg = _.pick(currState, ["keep"]);
    this.setState(currState, () => this.props.updateState({ cfg }));
  }

  test() {
    this.setState({ loadingTest: true });
    const params = {
      type: "column_names",
      cfg: JSON.stringify(_.pick(this.state, ["keep"])),
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
      let testOutput = this.props.t("No duplicate column names exist.");
      if (_.size(testData.results)) {
        testOutput = (
          <ul>
            {_.map(testData.results, (dupeCols, string) => (
              <li key={string}>
                <b>{string}</b>
                {this.props.t(" matches columns ")}
                <b>{_.join(dupeCols, ", ")}</b>
              </li>
            ))}
          </ul>
        );
      }
      this.setState({ testOutput, loadingTest: false });
    });
  }

  render() {
    return (
      <React.Fragment>
        <Keep value={this.state.keep} updateState={this.updateState} />
        <div className="form-group row">
          <div className="col-md-3" />
          <div className="col-md-8">
            <button className="col-auto btn btn-secondary" onClick={this.test}>
              {this.props.t("View Duplicates")}
            </button>
          </div>
        </div>
        <div className="form-group row">
          <div className="col-md-3" />
          <div className="col-md-8">
            <div className="input-group">
              <BouncerWrapper showBouncer={this.state.loadingTest}>{this.state.testOutput || ""}</BouncerWrapper>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}
ColumnNames.displayName = "ColumnNames";
ColumnNames.propTypes = {
  dataId: PropTypes.string,
  updateState: PropTypes.func,
  columns: PropTypes.array,
  t: PropTypes.func,
};
const TranslateColumnNames = withTranslation("duplicate")(ColumnNames);
export { TranslateColumnNames as ColumnNames, validateColumnNamesCfg };
