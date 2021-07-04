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
import ColumnSaveType from "../replacement/ColumnSaveType";
import * as createUtils from "./createUtils";

require("./CreateColumn.css");

class ReactCreateColumn extends React.Component {
  constructor(props) {
    super(props);
    this.state = _.assign({}, createUtils.BASE_STATE, props.prePopulated || {});
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
      this.setState(newState);
    });
  }

  componentDidUpdate(_prevProps, prevState) {
    if (this.state.type !== prevState.type && !this.state.namePopulated) {
      this.setState({ name: null });
    }
  }

  save() {
    const { name, saveAs, type, cfg } = this.state;
    let createParams = { saveAs };
    if (saveAs === "new") {
      if (!name) {
        this.setState({ error: <RemovableError error="Name is required!" /> });
        return;
      }
      if (_.find(this.state.columns, { name })) {
        this.setState({
          error: <RemovableError error={`The column '${name}' already exists!`} />,
        });
        return;
      }
      createParams.name = name;
    }
    const error = createUtils.validateCfg(this.props.t, type, cfg);
    if (!_.isNull(error)) {
      this.setState({ error: <RemovableError error={error} /> });
      return;
    }
    this.setState({ loadingColumn: true });
    createParams = { ...createParams, type, cfg: JSON.stringify(cfg) };
    fetchJson(buildURLString(`/dtale/build-column/${this.props.dataId}?`, createParams), data => {
      if (data.error) {
        this.setState({
          error: <RemovableError {...data} />,
          loadingColumn: false,
        });
        return;
      }
      this.setState({ loadingColumn: false }, () => {
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
    const updateState = state => {
      if (_.has(state, "code")) {
        state.code = _.assign({}, this.state.code, {
          [this.state.type]: state.code,
        });
      }
      this.setState(state);
    };
    const body = createUtils.getBody(this.state, this.props, updateState);
    return (
      <div key="body" className="modal-body">
        {createUtils.renderNameInput(this.state) === "name" && (
          <div className="form-group row">
            <label className="col-md-3 col-form-label text-right">{t("Name")}</label>
            <div className="col-md-8">
              <input
                type="text"
                className="form-control"
                value={this.state.name || ""}
                onChange={e =>
                  this.setState({
                    name: e.target.value,
                    namePopulated: _.size(e.target.value) > 0,
                  })
                }
              />
            </div>
          </div>
        )}
        {createUtils.renderNameInput(this.state) === "name_inplace" && (
          <ColumnSaveType propagateState={state => this.setState(state)} {...this.state} />
        )}
        {!_.has(this.props, "prePopulated.type") &&
          _.map(createUtils.TYPE_GROUPS, ({ buttons, label, className }, i) => (
            <div className={`form-group row mb-4 ${className ?? ""}`} key={i}>
              <label className="col-md-3 col-form-label text-right font-weight-bold">{t(label)}</label>
              <div className="col-md-8 builders">
                <div className="row">
                  {_.map(buttons, (type, j) => {
                    const isExponentialSmoothing = type === "exponential_smoothing";
                    const buttonProps = {
                      className: `btn w-100 ${isExponentialSmoothing ? "exponential-smoothing" : "col-type"}`,
                      style: {},
                    };
                    if (type === this.state.type) {
                      buttonProps.className += " btn-primary active";
                    } else {
                      buttonProps.className += " btn-light inactive pointer";
                      buttonProps.style.border = "solid 1px #a7b3b7";
                      const updatedState = { type, typeGroup: label };
                      if (type === "random") {
                        updatedState.cfg = { type: "float" };
                      }
                      if (type !== "type_conversion") {
                        updatedState.saveAs = "new";
                      }
                      buttonProps.onClick = () => this.setState(updatedState);
                    }
                    return (
                      <div key={`${i}-${j}`} className="col-md-3 p-1">
                        <button {...buttonProps}>{t(createUtils.buildLabel(type))}</button>
                      </div>
                    );
                  })}
                </div>
                {this.state.typeGroup == label && (
                  <label className="col-auto col-form-label pl-3 pr-3 pb-0 row" style={{ fontSize: "85%" }}>
                    {t(this.state.type)}
                  </label>
                )}
              </div>
            </div>
          ))}
        {body}
      </div>
    );
  }

  renderCode() {
    const { t } = this.props;
    if (_.get(this.state, ["code", this.state.type])) {
      const code = _.concat(_.get(this.state, ["code", this.state.type], []), []);
      let markup = null;
      if (_.size(code) > 2) {
        const isWindow = _.includes(window.location.pathname, `/dtale/popup/${this.state.type.split("_").join("-")}`);
        markup = (
          <div className="font-weight-bold hoverable">
            <div>{code[0]}</div>
            <div>{code[1]}</div>
            <div style={{ fontSize: "85%" }}>{t("hover to see more...")}</div>
            <div className={`hoverable__content build-code${isWindow ? "-window" : ""}`}>
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
          <span className="pr-3">Code:</span>
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
          <BouncerWrapper showBouncer={this.state.loadingColumn}>
            <span>{this.props.t(this.state.saveAs === "new" ? "Create" : "Apply")}</span>
          </BouncerWrapper>
        </button>
      </div>,
    ];
  }
}
ReactCreateColumn.displayName = "CreateColumn";
ReactCreateColumn.propTypes = {
  dataId: PropTypes.string.isRequired,
  chartData: PropTypes.shape({
    propagateState: PropTypes.func,
  }),
  prePopulated: PropTypes.object,
  onClose: PropTypes.func,
  t: PropTypes.func,
};
const TranslateReactCreateColumn = withTranslation("builders")(ReactCreateColumn);
const ReduxCreateColumn = connect(
  ({ dataId, chartData }) => ({ dataId, chartData }),
  dispatch => ({ onClose: chartData => dispatch(closeChart(chartData || {})) })
)(TranslateReactCreateColumn);
export { TranslateReactCreateColumn as ReactCreateColumn, ReduxCreateColumn as CreateColumn };
