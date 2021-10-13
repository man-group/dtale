import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import { BouncerWrapper } from "../../BouncerWrapper";
import { RemovableError } from "../../RemovableError";
import { closeChart } from "../../actions/charts";
import { buildURLString, dtypesUrl } from "../../actions/url-utils";
import * as gu from "../../dtale/gridUtils";
import { fetchJson } from "../../fetcher";
import ColumnSaveType from "./ColumnSaveType";
import { Imputer, validateImputerCfg } from "./Imputer";
import { Spaces, validateSpacesCfg } from "./Spaces";
import { Strings, validateStringsCfg } from "./Strings";
import { validateValueCfg, Value } from "./Value";

require("../create/CreateColumn.css");

const TYPES = [
  ["value", "Value(s)", () => true],
  ["spaces", "Spaces Only", colType => colType === "string"],
  ["strings", "Contains Char/Substring", colType => colType === "string"],
  ["imputer", "Scikit-Learn Imputer", colType => _.includes(["float", "int"], colType)],
];

class ReactCreateReplacement extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      type: null,
      types: [],
      saveAs: "inplace",
      name: null,
      cfg: null,
      code: {},
      loadingColumns: true,
      loadingReplacement: false,
    };
    this.save = this.save.bind(this);
    this.renderBody = this.renderBody.bind(this);
    this.renderCode = this.renderCode.bind(this);
  }

  componentDidMount() {
    fetchJson(dtypesUrl(this.props.dataId), dtypesData => {
      const newState = { error: null, loadingColumns: false };
      if (dtypesData.error) {
        this.setState({ error: <RemovableError {...dtypesData} /> });
        return;
      }
      newState.columns = dtypesData.dtypes;
      const col = _.get(this.props, "chartData.selectedCol");
      const lowerDtype = (gu.getDtype(col, newState.columns) || "").toLowerCase();
      newState.colType = gu.findColType(lowerDtype);
      newState.types = _.filter(TYPES, ([_type, _label, filterer]) => filterer(newState.colType));
      if (_.size(newState.types) === 1) {
        newState.type = newState.types[0][0];
      }
      this.setState(newState);
    });
  }

  save() {
    const { t } = this.props;
    const col = _.get(this.props, "chartData.selectedCol");
    const { columns, type, cfg, saveAs, name } = this.state;
    if (_.find(this.state.columns, { name })) {
      this.setState({
        error: <RemovableError error={`The column '${name}' already exists!`} />,
      });
      return;
    }
    let error;
    switch (type) {
      case "spaces":
        error = validateSpacesCfg(t, cfg);
        break;
      case "strings":
        error = validateStringsCfg(t, cfg);
        break;
      case "imputer":
        error = validateImputerCfg(t, cfg);
        break;
      case "values":
      default:
        error = validateValueCfg(t, cfg);
        break;
    }
    const createParams = { col, type, cfg: JSON.stringify(cfg) };
    if (saveAs === "new") {
      if (_.isNull(name) || name === "") {
        error = t("Please enter a name!");
      } else if (_.find(columns, { name })) {
        error = `${t("A column already exists with the name,")} ${name}!`;
      } else {
        createParams.name = name;
      }
    }
    if (!_.isNull(error)) {
      this.setState({ error: <RemovableError error={error} /> });
      return;
    }
    this.setState({ loadingReplacement: true });
    fetchJson(buildURLString(`/dtale/build-replacement/${this.props.dataId}?`, createParams), data => {
      if (data.error) {
        this.setState({
          error: <RemovableError {...data} />,
          loadingReplacement: false,
        });
        return;
      }
      this.setState({ loadingReplacement: false }, () => {
        if (_.startsWith(window.location.pathname, "/dtale/popup/build")) {
          window.opener.location.reload();
          window.close();
        } else {
          this.props.chartData.propagateState({ refresh: true }, this.props.onClose);
        }
      });
    });
  }

  renderBody() {
    const { t } = this.props;
    const col = _.get(this.props, "chartData.selectedCol");
    const { columns, colType, types } = this.state;
    const updateState = state => {
      if (_.has(state, "code")) {
        state.code = _.assign({}, this.state.code, {
          [this.state.type]: state.code,
        });
      }
      this.setState(state);
    };
    let body = null;
    switch (this.state.type) {
      case "spaces":
        body = <Spaces col={col} updateState={updateState} />;
        break;
      case "strings":
        body = <Strings col={col} colType={colType} updateState={updateState} />;
        break;
      case "imputer":
        body = <Imputer col={col} colType={colType} updateState={updateState} />;
        break;
      case "value":
        body = <Value {...{ col, colType, columns }} updateState={updateState} />;
        break;
    }
    return (
      <div key="body" className="modal-body">
        <ColumnSaveType propagateState={state => this.setState(state)} {...this.state} />
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">{t("Replacement Type", { ns: "replacement" })}</label>
          <div className="col-md-8">
            <div className="btn-group">
              {_.map(types, ([type, label, _filterer], i) => {
                const buttonProps = { className: "btn" };
                if (type === this.state.type) {
                  buttonProps.className += " btn-primary active";
                } else {
                  buttonProps.className += " btn-primary inactive";
                  buttonProps.onClick = () => this.setState({ type });
                }
                return (
                  <button key={i} {...buttonProps}>
                    {t(label, { ns: "replacement" })}
                  </button>
                );
              })}
            </div>
            {this.state.type && <small className="d-block pt-3">{t(this.state.type, { ns: "replacement" })}</small>}
          </div>
        </div>
        {body}
      </div>
    );
  }

  renderCode() {
    if (_.get(this.state, ["code", this.state.type])) {
      const code = _.concat(_.get(this.state, ["code", this.state.type], []), []);
      let markup;
      if (_.size(code) > 2) {
        markup = (
          <div className="font-weight-bold hoverable">
            <div>{code[0]}</div>
            <div>{code[1]}</div>
            <div style={{ fontSize: "85%" }}>{"hover to see more..."}</div>
            <div className="hoverable__content build-code" style={{ width: "auto" }}>
              <pre className="mb-0">{_.join(code, "\n")}</pre>
            </div>
          </div>
        );
      } else {
        markup = (
          <div className="font-weight-bold">
            {_.map(code, (c, i) => (
              <div key={i}>{c}</div>
            ))}
          </div>
        );
      }
      return (
        <div className="col" style={{ paddingRight: 0 }}>
          <span className="pr-3">{this.props.t("reshape:Code")}:</span>
          {markup}
        </div>
      );
    }
    return null;
  }

  render() {
    let error = null;
    if (this.state.error) {
      error = (
        <div key="error" className="row" style={{ margin: "0 2em" }}>
          <div className="col-md-12">{this.state.error}</div>
        </div>
      );
    }
    return [
      error,
      <BouncerWrapper key={0} showBouncer={this.state.loadingColumns}>
        {this.renderBody()}
      </BouncerWrapper>,
      <div key={1} className="modal-footer">
        {this.renderCode()}
        <button className="btn btn-primary" onClick={this.state.loadingColumn ? _.noop : this.save}>
          <BouncerWrapper showBouncer={this.state.loadingReplacement}>
            <span>{this.props.t("replacement:Replace")}</span>
          </BouncerWrapper>
        </button>
      </div>,
    ];
  }
}
ReactCreateReplacement.displayName = "CreateColumn";
ReactCreateReplacement.propTypes = {
  dataId: PropTypes.string.isRequired,
  chartData: PropTypes.shape({
    propagateState: PropTypes.func,
    selectedCol: PropTypes.string,
  }),
  onClose: PropTypes.func,
  t: PropTypes.func,
};
const TranslateReactCreateReplacement = withTranslation(["reshape", "replacement"])(ReactCreateReplacement);
const ReduxCreateReplacement = connect(
  ({ dataId, chartData }) => ({ dataId, chartData }),
  dispatch => ({ onClose: chartData => dispatch(closeChart(chartData || {})) })
)(TranslateReactCreateReplacement);
export { TranslateReactCreateReplacement as ReactCreateReplacement, ReduxCreateReplacement as CreateReplacement };
