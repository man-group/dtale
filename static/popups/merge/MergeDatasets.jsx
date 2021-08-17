import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";
import Select, { createFilter } from "react-select";

import { BouncerWrapper } from "../../BouncerWrapper";
import { RemovableError } from "../../RemovableError";
import { openChart } from "../../actions/charts";
import menuFuncs from "../../dtale/menu/dataViewerMenuUtils";
import { Popup } from "../Popup";
import { buildStat } from "../describe/detailUtils";
import ActionConfig from "./ActionConfig";
import DataPreview from "./DataPreview";
import MergeOutput from "./MergeOutput";

require("./MergeDatasets.scss");

function datasetName(instance) {
  return `${instance.data_id}${instance.name ? ` - ${instance.name}` : ""}`;
}

const colName = col => `${col.name} (${col.dtype})`;

class ReactMergeDatasets extends React.Component {
  constructor(props) {
    super(props);
    this.renderDatasetInputs = this.renderDatasetInputs.bind(this);
  }

  renderDatasetInputs(dataset, datasetIndex) {
    const { instances, action, t } = this.props;
    const { dataId, isDataOpen } = dataset;
    const instance = _.find(instances, { data_id: dataId });
    const { name, rows, columns } = instance;
    const columnOptions = _.sortBy(instance.names, "name");
    return (
      <dl key={datasetIndex} className="dataset accordion pt-3">
        <dt
          className={`dataset accordion-title${dataset.isOpen ? " is-expanded" : ""} pointer pl-3`}
          onClick={() => this.props.toggleDataset(datasetIndex)}>
          {`${t("Dataset")} ${datasetIndex + 1}`}
          <small>
            {` (${t("ID")}: ${instance.data_id}${name ? `, ${t("Name")}: ${name}` : ""}`}
            {`, ${t("Cols")}: ${columns}, ${t("Rows")}: ${rows})`}
          </small>
        </dt>
        <dd className={`p-0 dataset accordion-content${dataset.isOpen ? " is-expanded" : ""}`}>
          <div className="row pt-4 ml-0 mr-0">
            {action === "merge" && (
              <div className="col-md-6">
                <div className="form-group row">
                  <label className="col-md-2 col-form-label text-right">{t("Index(es)*")}:</label>
                  <div className="col-md-8">
                    <div className="input-group">
                      <Select
                        isMulti
                        className="Select is-clearable is-searchable Select--single"
                        classNamePrefix="Select"
                        options={columnOptions}
                        getOptionLabel={colName}
                        getOptionValue={_.property("name")}
                        value={dataset.index}
                        onChange={index => this.props.updateDataset(datasetIndex, "index", index)}
                        filterOption={createFilter({ ignoreAccents: false })}
                        placeholder={t("Select Indexes")}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="col-md-6">
              <div className="form-group row">
                <label className="col-md-2 col-form-label text-right">{t("Column(s)")}:</label>
                <div className="col-md-8">
                  <div className="input-group">
                    <Select
                      isMulti
                      className="Select is-clearable is-searchable Select--single"
                      classNamePrefix="Select"
                      options={columnOptions}
                      getOptionLabel={colName}
                      getOptionValue={_.property("name")}
                      value={dataset.columns}
                      onChange={columns => this.props.updateDataset(datasetIndex, "columns", columns)}
                      isClearable
                      filterOption={createFilter({ ignoreAccents: false })}
                      placeholder={t("All Columns Selected")}
                    />
                  </div>
                </div>
              </div>
            </div>
            {action === "merge" && (
              <div className="col-md-6">
                <div className="form-group row">
                  <label className="col-md-2 col-form-label text-right">{t("Suffix")}:</label>
                  <div className="col-md-8">
                    <input
                      type="text"
                      className="form-control"
                      value={dataset.suffix || ""}
                      onChange={e => this.props.updateDataset(datasetIndex, "suffix", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="col-md-6 mb-auto mt-auto">
              <div className="row">
                <div className="col" />
                <div className="col-auto">
                  <button className="btn-sm btn-primary pointer" onClick={() => this.props.removeDataset(datasetIndex)}>
                    <i className="ico-remove-circle pr-3" />
                    <span>{t("Remove Dataset")}</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="col-md-12">
              <dl className="dataset accordion pt-3">
                <dt
                  className={`dataset accordion-title${isDataOpen ? " is-expanded" : ""} pointer pl-3`}
                  onClick={() => this.props.updateDataset(datasetIndex, "isDataOpen", !isDataOpen)}>
                  {t("Data")}
                </dt>
                <dd className={`p-0 dataset accordion-content${isDataOpen ? " is-expanded" : ""} example`}>
                  <div className="row pt-4 ml-0 mr-0">
                    <div className="col-md-12" style={{ height: 200 }}>
                      <DataPreview dataId={dataId + ""} />
                    </div>
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </dd>
      </dl>
    );
  }

  render() {
    const { instances, clearErrors, t } = this.props;
    const buttonHandlers = menuFuncs.buildHotkeyHandlers(this.props);
    const { openPopup } = buttonHandlers;
    return (
      <React.Fragment>
        {this.props.loadingError && (
          <div className="ml-5 mr-5">
            <RemovableError {...this.props.loadingError} onRemove={clearErrors} />
          </div>
        )}
        {this.props.mergeError && (
          <div className="ml-5 mr-5">
            <RemovableError {...this.props.mergeError} onRemove={clearErrors} />
          </div>
        )}
        <ActionConfig />
        <BouncerWrapper showBouncer={this.props.loading}>
          <ul className="list-group ml-3 mr-3 pt-5">
            <li className="list-group-item p-3 section">
              <div className="row ml-0 mr-0">
                <div className="col-auto pl-4 pr-0">
                  <h3 className="d-inline">{t("Dataset Selection")}</h3>
                  <small>{t(` (Select By Clicking One of the Names Below)`)}</small>
                </div>
                <div className="col" />
                <div className="col-auto pr-0">
                  <button className="btn-sm btn-primary mr-5 pointer" onClick={openPopup("upload", 450)}>
                    <i className="ico-file-upload pr-3" />
                    <span>{t("Upload")}</span>
                  </button>
                </div>
              </div>
              <div className="row ml-0 mr-0">
                <BouncerWrapper showBouncer={this.props.loadingDatasets}>
                  {!this.props.loadingDatasets &&
                    _.map(instances, (instance, i) => {
                      const buttonProps = {
                        className: "btn w-100",
                        style: { padding: "0.45rem 0.3rem", color: "#111" },
                      };
                      buttonProps.className += " btn-light inactive pointer hoverable";
                      buttonProps.style.border = "solid 1px #a7b3b7";
                      buttonProps.onClick = () => this.props.addDataset(instance.data_id);
                      return (
                        <div key={i} className="col-md-3 p-1">
                          <button {...buttonProps}>
                            {datasetName(instance)}
                            <div className="hoverable__content pt-4 pl-0">
                              <ul>
                                <li>{buildStat(t, "Rows", instance.rows)}</li>
                                <li>{buildStat(t, "Columns", instance.columns)}</li>
                                <li>
                                  {buildStat(
                                    t,
                                    "Column Names",
                                    `${_.join(_.map(_.take(instance.names, 10), colName), ", ")}${
                                      _.size(instance.names) > 10 ? "..." : ""
                                    }`
                                  )}
                                </li>
                              </ul>
                            </div>
                          </button>
                        </div>
                      );
                    })}
                </BouncerWrapper>
              </div>
            </li>
          </ul>
          {!this.props.loading && (
            <div className="row p-4 ml-0 mr-0">
              <div className="col-md-12 p-0">{_.map(this.props.datasets, this.renderDatasetInputs)}</div>
            </div>
          )}
          {!this.props.loading && _.size(this.props.datasets) > 1 && <MergeOutput />}
        </BouncerWrapper>
        <Popup propagateState={(_state, callback) => callback()} dataId="1" />
      </React.Fragment>
    );
  }
}
ReactMergeDatasets.displayName = "ReactMergeDatasets";
ReactMergeDatasets.propTypes = {
  instances: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  loadingDatasets: PropTypes.bool,
  action: PropTypes.string,
  datasets: PropTypes.array,
  addDataset: PropTypes.func,
  removeDataset: PropTypes.func,
  toggleDataset: PropTypes.func,
  updateDataset: PropTypes.func,
  openChart: PropTypes.func, // eslint-disable-line react/no-unused-prop-types
  loadingError: PropTypes.object,
  mergeError: PropTypes.object,
  loadDatasets: PropTypes.func,
  clearErrors: PropTypes.func,
  t: PropTypes.func,
  isVSCode: PropTypes.bool,
};
const TranslateReactMergeDatasets = withTranslation("merge")(ReactMergeDatasets);
const ReduxMergeDatasets = connect(
  state =>
    _.pick(state, [
      "instances",
      "loading",
      "loadingDatasets",
      "action",
      "datasets",
      "loadingError",
      "mergeError",
      "isVSCode",
    ]),
  dispatch => ({
    addDataset: dataId => dispatch({ type: "add-dataset", dataId }),
    removeDataset: index => dispatch({ type: "remove-dataset", index }),
    toggleDataset: index => dispatch({ type: "toggle-dataset", index }),
    updateDataset: (index, prop, value) => dispatch({ type: "update-dataset", index, prop, value }),
    clearErrors: () => dispatch({ type: "clear-errors" }),
    openChart: chartProps => dispatch(openChart(chartProps)),
  })
)(TranslateReactMergeDatasets);
export { ReduxMergeDatasets as default, TranslateReactMergeDatasets as ReactMergeDatasets };
