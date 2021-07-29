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
import { Aggregate, validateAggregateCfg } from "./Aggregate";
import { Pivot, validatePivotCfg } from "./Pivot";
import { Resample, validateResampleCfg } from "./Resample";
import { Transpose, validateTransposeCfg } from "./Transpose";

require("./Reshape.css");

function buildForwardURL(href, dataId) {
  return `${_.join(_.initial((href || "").split("/")), "/")}/${dataId}`;
}

const OPERATIONS = {
  reshape: [
    ["aggregate", "GroupBy"],
    ["pivot", "Pivot"],
    ["transpose", "Transpose"],
  ],
  timeseries: [["resample", "Resample"]],
};

const baseState = operation => ({
  type: operation === "timeseries" ? "resample" : "pivot",
  output: "new",
  cfg: {},
  code: {},
  loadingColumns: true,
  loadingReshape: false,
});

class ReactReshape extends React.Component {
  constructor(props) {
    super(props);
    this.state = baseState(props.operation);
    this.save = this.save.bind(this);
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

  save() {
    const { type, cfg, output } = this.state;
    let error = null;
    switch (type) {
      case "transpose":
        error = validateTransposeCfg(cfg);
        break;
      case "aggregate":
        error = validateAggregateCfg(cfg);
        break;
      case "resample":
        error = validateResampleCfg(cfg);
        break;
      case "pivot":
      default:
        error = validatePivotCfg(cfg);
        break;
    }
    if (!_.isNull(error)) {
      this.setState({ error: <RemovableError error={this.props.t(error)} /> });
      return;
    }
    this.setState({ loadingReshape: true });
    const createParams = { type, cfg: JSON.stringify(cfg), output };
    fetchJson(buildURLString(`/dtale/reshape/${this.props.dataId}?`, createParams), data => {
      if (data.error) {
        this.setState({
          error: <RemovableError {...data} />,
          loadingReshape: false,
        });
        return;
      }
      this.setState({ loadingReshape: false }, () => {
        if (_.startsWith(window.location.pathname, "/dtale/popup/reshape")) {
          window.opener.location.assign(buildForwardURL(window.opener.location.href, data.data_id));
          window.close();
          return;
        }
        const newLoc = buildForwardURL(window.location.href, data.data_id);
        if (output === "new") {
          this.props.onClose();
          window.open(newLoc, "_blank");
          return;
        }
        window.location.assign(newLoc);
      });
    });
  }

  renderBody() {
    const { t } = this.props;
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
      case "transpose":
        body = <Transpose columns={this.state.columns} updateState={updateState} />;
        break;
      case "aggregate":
        body = <Aggregate columns={this.state.columns} updateState={updateState} />;
        break;
      case "resample":
        body = <Resample columns={this.state.columns} updateState={updateState} />;
        break;
      case "pivot":
      default:
        body = <Pivot columns={this.state.columns} updateState={updateState} />;
        break;
    }
    return (
      <div key="body" className="modal-body">
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">{t("Operation")}</label>
          <div className="col-md-8">
            <div className="btn-group">
              {_.map(OPERATIONS[this.props.operation], ([type, label], i) => {
                const buttonProps = { className: "btn" };
                if (type === this.state.type) {
                  buttonProps.className += " btn-primary active";
                } else {
                  buttonProps.className += " btn-primary inactive";
                  buttonProps.onClick = () => this.setState({ type });
                }
                if (type === "pivot") {
                  buttonProps.className += " p-3";
                }
                return (
                  <button key={i} {...buttonProps}>
                    <span className="d-block">{t(label)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {body}
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">{t("Output")}</label>
          <div className="col-md-8">
            <div className="btn-group">
              {_.map(
                [
                  ["new", "New Instance"],
                  ["override", "Override Current"],
                ],
                ([output, label], i) => {
                  const buttonProps = { className: "btn" };
                  if (output === this.state.output) {
                    buttonProps.className += " btn-primary active";
                  } else {
                    buttonProps.className += " btn-primary inactive";
                    buttonProps.onClick = () => this.setState({ output });
                  }
                  return (
                    <button key={i} {...buttonProps}>
                      {t(label)}
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { t } = this.props;
    let error = null;
    if (this.state.error) {
      error = (
        <div key="error" className="row" style={{ margin: "0 2em" }}>
          <div className="col-md-12">{this.state.error}</div>
        </div>
      );
    }
    let codeMarkup = null;
    if (_.get(this.state, ["code", this.state.type])) {
      codeMarkup = (
        <div className="col" style={{ paddingRight: 0 }}>
          <span className="pr-3">{t("Code")}:</span>
          <span className="font-weight-bold">{_.get(this.state, ["code", this.state.type])}</span>
        </div>
      );
    }
    return [
      error,
      <BouncerWrapper key={0} showBouncer={this.state.loadingColumns}>
        {this.renderBody()}
      </BouncerWrapper>,
      <div key={1} className="modal-footer">
        {codeMarkup}
        <button className="btn btn-primary" onClick={this.state.loadingReshape ? _.noop : this.save}>
          <BouncerWrapper showBouncer={this.state.loadingReshape}>
            <span>{t("Execute")}</span>
          </BouncerWrapper>
        </button>
      </div>,
    ];
  }
}
ReactReshape.displayName = "Reshape";
ReactReshape.propTypes = {
  dataId: PropTypes.string.isRequired,
  chartData: PropTypes.shape({
    propagateState: PropTypes.func,
  }),
  onClose: PropTypes.func,
  t: PropTypes.func,
  operation: PropTypes.string,
};
ReactReshape.defaultProps = { operation: "reshape" };
const TranslateReactReshape = withTranslation("reshape")(ReactReshape);
const ReduxReshape = connect(
  ({ dataId, chartData }) => ({ dataId, chartData }),
  dispatch => ({ onClose: chartData => dispatch(closeChart(chartData || {})) })
)(TranslateReactReshape);
export { buildForwardURL, TranslateReactReshape as ReactReshape, ReduxReshape as Reshape };
