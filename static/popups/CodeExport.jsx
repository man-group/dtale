import PropTypes from "prop-types";
import React from "react";

import { RemovableError } from "../RemovableError";
import { buildURL } from "../actions/url-utils";
import { fetchJson } from "../fetcher";
import { CodePopup } from "./CodePopup";

const BASE_CODE_URL = "/dtale/code-export";

class CodeExport extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, code: null };
  }

  componentDidMount() {
    fetchJson(buildURL(`${BASE_CODE_URL}/${this.props.dataId}`), codeData => {
      const newState = { error: null, code: null };
      if (codeData.error) {
        this.setState({ error: <RemovableError {...codeData} /> });
        return;
      }
      newState.code = codeData.code;
      this.setState(newState);
    });
  }

  render() {
    if (this.state.error) {
      return (
        <div key="body" className="modal-body">
          {this.state.error}
        </div>
      );
    }
    return <CodePopup code={this.state.code} />;
  }
}
CodeExport.displayName = "CodeExport";
CodeExport.propTypes = {
  dataId: PropTypes.string.isRequired,
};

export { CodeExport };
