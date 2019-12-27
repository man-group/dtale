import _ from "lodash";
import React from "react";

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
              <span>{"Your version is currently out of sync with PyPi."}</span>
              <br />
              <span>{"Please upgrade."}</span>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div key="body" className="modal-body">
        <div className="row">
          <div className="col-md-12">
            <span>{"Your Version:"}</span>
            <span className="font-weight-bold pl-5">{currentVersion || ""}</span>
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <span>{"PyPi Version:"}</span>
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
              {"GitHub"}
            </a>
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <a href={`https://dtale.readthedocs.io/en/v${currentVersion}`} rel="noopener noreferrer" target="_blank">
              <i className="fas fa-book-open mr-4" />
              {"readthedocs.io"}
            </a>
          </div>
        </div>
      </div>
    );
  }
}
About.displayName = "About";

export default About;
