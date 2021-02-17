import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import { BouncerWrapper } from "../../BouncerWrapper";
import { RemovableError } from "../../RemovableError";
import { closeChart } from "../../actions/charts";
import { buildURLString, dtypesUrl } from "../../actions/url-utils";
import { fetchJson } from "../../fetcher";
import { buildForwardURL } from "../reshape/Reshape";
import { ColumnNames, validateColumnNamesCfg } from "./ColumnNames";
import { Columns, validateColumnsCfg } from "./Columns";
import { Rows, validateRowsCfg } from "./Rows";
import { ShowDuplicates, validateShowDuplicatesCfg } from "./ShowDuplicates";

require("./Duplicates.css");

const TYPES = [
  ["columns", "Remove\nDuplicate Columns"],
  ["column_names", "Remove Duplicate\nColumn Names"],
  ["rows", "Remove\nDuplicate Rows"],
  ["show", "Show\nDuplicates"],
];

const TYPE_DESC = {
  columns: "Remove columns that contain the same data.",
  column_names: "Remove columns with the same name (case-insensitive)",
  rows: "Remove duplicate rows based on a subset of columns.",
  show: "Show all duplicates data or duplicate data for a specific value.",
};

class ReactDuplicates extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      type: "columns",
      executing: false,
      output: "this",
    };
    const selectedCol = _.get(props, "chartData.selectedCol");
    if (selectedCol) {
      this.state.type = "rows";
      this.state.cfg = { subset: [selectedCol], keep: "first" };
    }
    this.execute = this.execute.bind(this);
    this.updateState = this.updateState.bind(this);
    this.renderBody = this.renderBody.bind(this);
  }

  componentDidMount() {
    fetchJson(dtypesUrl(this.props.dataId), dtypesData => {
      const newState = { error: null, loadingColumns: false };
      if (dtypesData.error) {
        this.setState({ error: <RemovableError {...dtypesData} /> });
        return;
      }
      newState.columns = dtypesData.dtypes;
      this.setState(newState);
    });
  }

  execute() {
    const { type, cfg } = this.state;
    let error = null;
    switch (type) {
      case "columns":
        error = validateColumnsCfg(cfg);
        break;
      case "columnNames":
        error = validateColumnNamesCfg(cfg);
        break;
      case "rows":
        error = validateRowsCfg(cfg);
        break;
      case "show":
        error = validateShowDuplicatesCfg(cfg);
        break;
    }
    if (!_.isNull(error)) {
      this.setState({ error: <RemovableError error={this.props.t(error)} /> });
      return;
    }
    this.setState({ executing: true });
    const params = {
      type: this.state.type,
      cfg: JSON.stringify(this.state.cfg),
      action: "execute",
    };
    fetchJson(buildURLString(`/dtale/duplicates/${this.props.dataId}?`, params), data => {
      if (data.error) {
        this.setState({
          error: <RemovableError {...data} />,
          executing: false,
        });
        return;
      }
      this.setState({ executing: false }, () => {
        if (_.startsWith(window.location.pathname, "/dtale/popup/duplicates")) {
          window.opener.location.assign(buildForwardURL(window.opener.location.href, data.data_id));
          window.close();
          return;
        }
        const newLoc = buildForwardURL(window.location.href, data.data_id);
        if (this.state.output === "new") {
          this.props.onClose();
          window.open(newLoc, "_blank");
          return;
        }
        window.location.assign(newLoc);
      });
    });
  }

  updateState(state) {
    this.setState(state);
  }

  renderBody() {
    let body = null;
    const { dataId, t } = this.props;
    const bodyProps = {
      updateState: this.updateState,
      dataId,
    };
    switch (this.state.type) {
      case "columns":
        body = <Columns {...bodyProps} />;
        break;
      case "column_names":
        body = <ColumnNames {...bodyProps} />;
        break;
      case "rows":
        body = (
          <Rows selectedCol={_.get(this.props, "chartData.selectedCol")} columns={this.state.columns} {...bodyProps} />
        );
        break;
      case "show":
        body = <ShowDuplicates columns={this.state.columns} {...bodyProps} />;
        break;
    }
    return (
      <React.Fragment>
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">{t("Operation")}</label>
          <div className="col-md-8">
            <div className="btn-group duplicate-types">
              {_.map(TYPES, ([type, label], i) => {
                const buttonProps = { className: "btn" };
                if (type === this.state.type) {
                  buttonProps.className += " btn-primary active";
                } else {
                  buttonProps.className += " btn-primary inactive";
                  buttonProps.onClick = () => this.setState({ type });
                }
                return (
                  <button key={i} {...buttonProps}>
                    {t(label)}
                  </button>
                );
              })}
            </div>
            {this.state.type && <small className="d-block pt-3">{t(TYPE_DESC[this.state.type])}</small>}
          </div>
        </div>
        {body}
      </React.Fragment>
    );
  }

  render() {
    let error = null;
    if (this.state.error) {
      error = (
        <div className="row" style={{ margin: "0 2em" }}>
          <div className="col-md-12">{this.state.error}</div>
        </div>
      );
    }
    return (
      <React.Fragment>
        <div className="modal-body">
          {error}
          {this.renderBody()}
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={this.state.executing ? _.noop : this.execute}>
            <BouncerWrapper showBouncer={this.state.executing}>
              <span>{this.props.t("Execute")}</span>
            </BouncerWrapper>
          </button>
        </div>
      </React.Fragment>
    );
  }
}
ReactDuplicates.displayName = "ReactDuplicates";
ReactDuplicates.propTypes = {
  dataId: PropTypes.string.isRequired,
  chartData: PropTypes.shape({
    selectedCol: PropTypes.string,
    propagateState: PropTypes.func,
  }),
  onClose: PropTypes.func,
  t: PropTypes.func,
};
const TranslateReactDuplicates = withTranslation("duplicate")(ReactDuplicates);
const ReduxDuplicates = connect(
  ({ dataId, chartData }) => ({ dataId, chartData }),
  dispatch => ({ onClose: chartData => dispatch(closeChart(chartData || {})) })
)(TranslateReactDuplicates);
export { TranslateReactDuplicates as ReactDuplicates, ReduxDuplicates as Duplicates };
