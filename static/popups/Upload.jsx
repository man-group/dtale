import $ from "jquery";
import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import Dropzone from "react-dropzone";
import { connect } from "react-redux";

import { Bouncer } from "../Bouncer";
import { BouncerWrapper } from "../BouncerWrapper";
import { RemovableError } from "../RemovableError";
import { buildURLString } from "../actions/url-utils";
import menuFuncs from "../dtale/menu/dataViewerMenuUtils";
import { fetchJson } from "../fetcher";
import { buildForwardURL } from "./reshape/Reshape";

require("./Upload.css");

const DATASETS = [
  { value: "covid", label: "COVID-19" },
  { value: "seinfeld", label: "Seinfeld" },
  { value: "simpsons", label: "The Simpsons" },
  { value: "video_games", label: "Video Games" },
  { value: "movies", label: "Movies" },
  { value: "time_dataframe", label: "makeTimeDataFrame" },
];

const DATASET_DESCRIPTIONS = {
  covid: "US COVID-19 data from the NY Times.",
  seinfeld:
    "Dataset of all lines by character & season for the tv show Seinfeld (" +
    "https://github.com/4m4n5/the-seinfeld-chronicles)",
  simpsons: "Dataset of all lines by character & season (16 seasons) for the tv show The Simpsons",
  video_games: "Dataset video games and their sales",
  movies: "Dataset of movies and their release date, director, sales, reviews, etc...",
  time_dataframe: "Output from running pandas.util.testing.makeTimeDataFrame()",
};

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
        loadingURL: false,
        loadingDataset: null,
      });
      return;
    }
    if (_.startsWith(window.location.pathname, "/dtale/popup/upload")) {
      if (window.opener) {
        window.opener.location.assign(buildForwardURL(window.opener.location.href, data.data_id));
        window.close();
      } else {
        // when we've started D-Tale with no data
        window.location.assign(window.location.origin);
      }
      return;
    }
    const newLoc = buildForwardURL(window.location.href, data.data_id);
    window.location.assign(newLoc);
  }

  onDrop(files) {
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        /*
         * I'm not sure if reader.onload will be executed in order.
         * For example, if the 1st file is larger than the 2nd one,
         * the 2nd file might load first.
         */
        const contents = reader.result;
        const size = file.size;
        const name = file.name;
        const lastModified = new Date(file.lastModified);
        this.setState(
          {
            file: { size, name, lastModified },
            loading: true,
            error: null,
          },
          () => $.post(menuFuncs.fullPath("/dtale/upload"), { contents, filename: name }, this.handleResponse)
        );
      };
      reader.readAsDataURL(file);
    });
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
    const { error, file, loading, loadingDataset, loadingURL } = this.state;
    return (
      <div key="body" className="modal-body">
        <h3>Load File</h3>
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
                    <input {...getInputProps()} />
                    <div data-filetype=".csv" className="filepicker-file-icon"></div>
                    <div data-filetype=".tsv" className="filepicker-file-icon"></div>
                    <div className="dz-default dz-message">
                      <span>Drop data files here to upload, or click to select files</span>
                    </div>
                  </div>
                  <aside className="dropzone-aside">
                    {file && (
                      <React.Fragment>
                        <h4>Loading File</h4>
                        <ul>
                          <li>{`${file.name} - ${file.size} bytes`}</li>
                          <li>{`Last Modified: ${file.lastModified}`}</li>
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
            <h3>Load From The Web</h3>
          </div>
          <div className="col text-right">
            {this.state.urlDataType && this.state.url && (
              <BouncerWrapper showBouncer={loadingURL}>
                <button className="btn btn-primary p-3" onClick={this.loadFromWeb}>
                  Load
                </button>
              </BouncerWrapper>
            )}
          </div>
        </div>
        <div className="form-group row">
          <label className="col-md-3 col-form-label text-right">Data Type</label>
          <div className="col-md-8 p-0">
            <div className="btn-group">
              {_.map(["csv", "tsv", "json"], urlDataType => {
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
            {"Proxy"}
            <small className="pl-3">(Optional)</small>
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
          <h3 className="d-inline">Sample Datasets</h3>
          <small className="pl-3 d-inline">(Requires access to web)</small>
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
                    datasetDescription: _.get(DATASET_DESCRIPTIONS, value, ""),
                  });
                return (
                  <div key={value} className="col-md-4 p-1">
                    <button {...buttonProps}>
                      <BouncerWrapper showBouncer={loadingDataset === value}>
                        <span>{label || value}</span>
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
      </div>
    );
  }
}
ReactUpload.displayName = "Upload";
ReactUpload.propTypes = {
  chartData: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
  }),
};

const ReduxUpload = connect(state => _.pick(state, ["chartData"]))(ReactUpload);

export { ReactUpload, ReduxUpload as Upload };
