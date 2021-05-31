import $ from "jquery";
import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import Dropzone from "react-dropzone";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import { Bouncer } from "../../Bouncer";
import { BouncerWrapper } from "../../BouncerWrapper";
import { RemovableError } from "../../RemovableError";
import { buildURLString } from "../../actions/url-utils";
import menuFuncs from "../../dtale/menu/dataViewerMenuUtils";
import { fetchJson } from "../../fetcher";
import CSVOptions from "./CSVOptions";
import SheetSelector from "./SheetSelector";
import { jumpToDataset } from "./uploadUtils";

require("./Upload.css");

const DATASETS = [
  { value: "covid", label: "COVID-19" },
  { value: "seinfeld", label: "Seinfeld" },
  { value: "simpsons", label: "The Simpsons" },
  { value: "video_games", label: "Video Games" },
  { value: "movies", label: "Movies" },
  { value: "time_dataframe", label: "makeTimeDataFrame" },
];

class ReactUpload extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      file: null,
      urlDataType: null,
      url: null,
      proxy: null,
      loadingDataset: null,
      loadingURL: false,
      sheets: null,
      webSheets: null,
      csv: { show: false },
    };
    this.onDrop = this.onDrop.bind(this);
    this.loadFromWeb = this.loadFromWeb.bind(this);
    this.loadDataset = this.loadDataset.bind(this);
    this.handleResponse = this.handleResponse.bind(this);
  }

  handleResponse(data) {
    if (data.error) {
      this.setState({
        error: <RemovableError {...data} />,
        loading: false,
        loadingURL: false,
        loadingDataset: null,
        csv: { show: false },
      });
      return;
    }
    if (data.sheets) {
      this.setState({
        sheets: _.map(data.sheets, sheet => ({ ...sheet, selected: true })),
        loading: false,
        csv: { show: false },
      });
      return;
    }
    jumpToDataset(data.data_id, this.props.mergeRefresher);
  }

  onDrop(files) {
    const fd = new FormData();
    let hasCSV = false;
    files.forEach(file => {
      fd.append(file.name, file);
      if (_.endsWith(file.name, "csv")) {
        hasCSV = true;
      }
    });
    this.setState({ loading: true });
    const postUpload = (additionalParameters = {}) => {
      _.forEach(additionalParameters, (value, key) => {
        fd.append(key, value);
      });
      $.ajax({
        type: "POST",
        url: menuFuncs.fullPath("/dtale/upload"),
        data: fd,
        contentType: false,
        processData: false,
        success: this.handleResponse,
        error: this.handleResponse,
      });
    };
    if (hasCSV) {
      this.setState({
        csv: { show: true, loader: postUpload },
      });
    } else {
      postUpload();
    }
  }

  loadFromWeb() {
    const { urlDataType, url, proxy } = this.state;
    this.setState({ loadingURL: true });
    fetchJson(buildURLString("/dtale/web-upload", { type: urlDataType, url, proxy }), this.handleResponse);
  }

  loadDataset(dataset) {
    this.setState({ loadingDataset: dataset });
    fetchJson(buildURLString("/dtale/datasets", { dataset }), this.handleResponse);
  }

  render() {
    const { mergeRefresher, t } = this.props;
    const { error, file, loading, loadingDataset, loadingURL, sheets } = this.state;
    const propagateState = state => this.setState(state);
    return (
      <div key="body" className="modal-body">
        <h3>{t("Load File")}</h3>
        <div className="row">
          <div className="col-md-12">
            <Dropzone
              onDrop={this.onDrop}
              disabled={false}
              disableClick={false}
              maxSize={Infinity}
              minSize={0}
              multiple={false}
              activeStyle={{
                borderStyle: "solid",
                borderColor: "#6c6",
                backgroundColor: "#eee",
              }}
              rejectStyle={{
                borderStyle: "solid",
                borderColor: "#c66",
                backgroundColor: "#eee",
              }}
              disabledStyle={{ opacity: 0.5 }}>
              {({ getRootProps, getInputProps }) => (
                <section className="container">
                  <div
                    {...getRootProps({
                      className: "filepicker dropzone dz-clickable",
                    })}>
                    <input {...getInputProps()} name="file" />
                    <div data-filetype=".csv" className="filepicker-file-icon"></div>
                    <div data-filetype=".tsv" className="filepicker-file-icon"></div>
                    <div data-filetype=".xls" className="filepicker-file-icon"></div>
                    <div data-filetype=".xlsx" className="filepicker-file-icon"></div>
                    <div className="dz-default dz-message">
                      <span>{t("Drop data files here to upload, or click to select files")}</span>
                    </div>
                  </div>
                  <aside className="dropzone-aside">
                    {file && (
                      <React.Fragment>
                        <h4>{t("Loading File")}</h4>
                        <ul>
                          <li>{`${file.name} - ${file.size} bytes`}</li>
                          <li>{`${t("Last Modified:")}: ${file.lastModified}`}</li>
                        </ul>
                      </React.Fragment>
                    )}
                    {loading && <Bouncer />}
                    {error}
                  </aside>
                </section>
              )}
            </Dropzone>
          </div>
        </div>
        <div className="row pt-5">
          <div className="col-auto">
            <h3>{t("Load From The Web")}</h3>
          </div>
          <div className="col text-right">
            {this.state.urlDataType && this.state.url && (
              <BouncerWrapper showBouncer={loadingURL}>
                <button className="btn btn-primary p-3" onClick={this.loadFromWeb}>
                  {t("Load")}
                </button>
              </BouncerWrapper>
            )}
          </div>
        </div>
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">{t("Data Type")}</label>
          <div className="col-md-8 p-0">
            <div className="btn-group">
              {_.map(["csv", "tsv", "json", "excel"], urlDataType => {
                const buttonProps = { className: "btn btn-primary" };
                if (urlDataType === this.state.urlDataType) {
                  buttonProps.className += " active";
                } else {
                  buttonProps.className += " inactive";
                  buttonProps.onClick = () => this.setState({ urlDataType });
                }
                return (
                  <button key={urlDataType} {...buttonProps}>
                    {urlDataType.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">URL</label>
          <div className="col-md-8 p-0">
            <input
              type="text"
              className="form-control"
              value={this.state.url || ""}
              onChange={e => this.setState({ url: e.target.value })}
            />
          </div>
        </div>
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">
            {t("Proxy")}
            <small className="pl-3">{t("(Optional)")}</small>
          </label>
          <div className="col-md-8 p-0">
            <input
              type="text"
              className="form-control"
              value={this.state.proxy || ""}
              onChange={e => this.setState({ proxy: e.target.value })}
            />
          </div>
        </div>
        <div className="pb-5">
          <h3 className="d-inline">{t("Sample Datasets")}</h3>
          <small className="pl-3 d-inline">{t("(Requires access to web)")}</small>
        </div>
        <div className="form-group row pl-5 pr-5">
          <div className="col-md-12 text-center">
            <div className="row">
              {_.map(DATASETS, ({ value, label }) => {
                const buttonProps = {
                  className: "btn btn-light w-100 inactive pointer dataset",
                  style: { padding: "0.45rem 0.3rem" },
                };
                buttonProps.className += loadingDataset === value ? " p-4" : "";
                buttonProps.style.border = "solid 1px #a7b3b7";
                buttonProps.onClick = () => this.loadDataset(value);
                buttonProps.onMouseOver = () =>
                  this.setState({
                    datasetDescription: t(value),
                  });
                return (
                  <div key={value} className="col-md-4 p-1">
                    <button {...buttonProps}>
                      <BouncerWrapper showBouncer={loadingDataset === value}>
                        <span>{t(label || value)}</span>
                      </BouncerWrapper>
                    </button>
                  </div>
                );
              })}
            </div>
            <label className="col col-form-label row" style={{ fontSize: "85%" }}>
              {this.state.datasetDescription || ""}
            </label>
          </div>
        </div>
        <SheetSelector sheets={sheets} propagateState={propagateState} mergeRefresher={mergeRefresher} />
        <CSVOptions {...this.state.csv} propagateState={propagateState} />
      </div>
    );
  }
}
ReactUpload.displayName = "ReactUpload";
ReactUpload.propTypes = {
  chartData: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
  }),
  mergeRefresher: PropTypes.func,
  t: PropTypes.func,
};
const TranslateReactUpload = withTranslation("upload")(ReactUpload);
const Upload = connect(state => _.pick(state, ["chartData"]))(TranslateReactUpload);
export { Upload, TranslateReactUpload as ReactUpload };
