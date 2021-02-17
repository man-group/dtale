import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { fetchJson } from "../fetcher";

const PYPI_API = "https://pypi.org/pypi/dtale/json";

class About extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentVersion: document.getElementById("version").value,
      pypiVersion: null,
    };
  }

  componentDidMount() {
    fetchJson(PYPI_API, pypiData => this.setState({ pypiVersion: _.get(pypiData, "info.version") }));
  }

  render() {
    const { currentVersion, pypiVersion } = this.state;
    let outOfDate = null;
    if (currentVersion !== pypiVersion) {
      outOfDate = (
        <div className="row">
          <div className="col-md-12">
            <div className="dtale-alert alert alert-danger text-center" role="alert">
              <span>{this.props.t("Your version is currently out of sync with PyPi.")}</span>
              <br />
              <span>{this.props.t("Please upgrade.")}</span>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div key="body" className="modal-body">
        <div className="row">
          <div className="col-md-12">
            <span>{`${this.props.t("Your Version")}:`}</span>
            <span className="font-weight-bold pl-5">{currentVersion || ""}</span>
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <span>{`${this.props.t("PyPi Version")}:`}</span>
            <span className="font-weight-bold pl-5">{pypiVersion || ""}</span>
          </div>
        </div>
        {outOfDate}
        <div className="row">
          <div className="col-md-12">
            <a
              href={`https://github.com/man-group/dtale/tree/v${currentVersion}`}
              rel="noopener noreferrer"
              target="_blank">
              <i className="fab fa-github mr-4" />
              {this.props.t("GitHub")}
            </a>
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <a href={`https://dtale.readthedocs.io/en/v${currentVersion}`} rel="noopener noreferrer" target="_blank">
              <i className="fas fa-book-open mr-4" />
              {this.props.t("readthedocs.io")}
            </a>
          </div>
        </div>
      </div>
    );
  }
}
About.displayName = "About";
About.propTypes = { t: PropTypes.func };

export default withTranslation("about")(About);
