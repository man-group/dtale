import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import { BouncerWrapper } from "../../BouncerWrapper";
import { RemovableError } from "../../RemovableError";
import { closeChart } from "../../actions/charts";
import { buildURLString, dtypesUrl } from "../../actions/url-utils";
import { fetchJson } from "../../fetcher";
import { CreateBins, validateBinsCfg } from "./CreateBins";
import { CreateDatetime, validateDatetimeCfg } from "./CreateDatetime";
import { CreateNumeric, validateNumericCfg } from "./CreateNumeric";

require("./CreateColumn.css");

const BASE_STATE = {
  type: "numeric",
  name: "",
  cfg: null,
  code: {},
  loadingColumns: true,
};

class ReactCreateColumn extends React.Component {
  constructor(props) {
    super(props);
    this.state = _.assign({}, BASE_STATE);
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
    const { name, type, cfg } = this.state;
    if (name === "") {
      this.setState({ error: <RemovableError error="Name is required!" /> });
      return;
    }
    if (_.find(this.state.columns, { name })) {
      this.setState({
        error: <RemovableError error={`The column '${name}' already exists!`} />,
      });
      return;
    }
    let error = null;
    switch (type) {
      case "datetime":
        error = validateDatetimeCfg(cfg);
        break;
      case "bins":
        error = validateBinsCfg(cfg);
        break;
      case "numeric":
      default:
        error = validateNumericCfg(cfg);
        break;
    }
    if (!_.isNull(error)) {
      this.setState({ error: <RemovableError error={error} /> });
      return;
    }
    const createParams = { name, type, cfg: JSON.stringify(cfg) };
    fetchJson(buildURLString(`/dtale/build-column/${this.props.dataId}?`, createParams), data => {
      if (data.error) {
        this.setState({ error: <RemovableError {...data} /> });
      } else if (_.startsWith(window.location.pathname, "/dtale/popup/build")) {
        window.opener.location.reload();
      } else {
        this.props.chartData.propagateState({ refresh: true }, this.props.onClose);
      }
    });
  }

  renderBody() {
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
      case "numeric":
        body = <CreateNumeric columns={this.state.columns} updateState={updateState} />;
        break;
      case "datetime":
        body = <CreateDatetime columns={this.state.columns} updateState={updateState} />;
        break;
      case "bins":
        body = <CreateBins columns={this.state.columns} updateState={updateState} />;
        break;
    }
    return (
      <div key="body" className="modal-body">
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">Name</label>
          <div className="col-md-8">
            <input
              type="text"
              className="form-control"
              value={this.state.name || ""}
              onChange={e => this.setState({ name: e.target.value })}
            />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">Column Type</label>
          <div className="col-md-8">
            <div className="btn-group">
              {_.map(["numeric", "bins", "datetime"], (type, i) => {
                const buttonProps = { className: "btn" };
                if (type === this.state.type) {
                  buttonProps.className += " btn-primary active";
                } else {
                  buttonProps.className += " btn-primary inactive";
                  buttonProps.onClick = () => this.setState({ type });
                }
                return (
                  <button key={i} {...buttonProps}>
                    {_.capitalize(type)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {body}
      </div>
    );
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
    let codeMarkup = null;
    if (_.get(this.state, ["code", this.state.type])) {
      codeMarkup = (
        <div className="col" style={{ paddingRight: 0 }}>
          <span className="pr-3">Code:</span>
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
        <button className="btn btn-primary" onClick={this.save}>
          <span>Create</span>
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
  onClose: PropTypes.func,
};

const ReduxCreateColumn = connect(
  ({ dataId, chartData }) => ({ dataId, chartData }),
  dispatch => ({ onClose: chartData => dispatch(closeChart(chartData || {})) })
)(ReactCreateColumn);
export { ReactCreateColumn, ReduxCreateColumn as CreateColumn };
