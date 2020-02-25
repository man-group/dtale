import PropTypes from "prop-types";
import React from "react";

import { canCopy, CopyToClipboard } from "../CopyToClipboard";
import { JSAnchor } from "../JSAnchor";
import menuFuncs from "../dtale/dataViewerMenuUtils";

function renderCodePopupAnchor(code, title) {
  const onClick = () => {
    window.code_popup = { code, title };
    menuFuncs.open("/dtale/code-popup", null, 450, 700);
  };
  return (
    <JSAnchor onClick={onClick}>
      <i className="ico-code pr-3" />
      <span>Code Snippet</span>
    </JSAnchor>
  );
}

class CodePopup extends React.Component {
  constructor(props) {
    super(props);
    this.renderCopyToClipboard = this.renderCopyToClipboard.bind(this);
  }

  renderCopyToClipboard() {
    if (canCopy()) {
      const buttonBuilder = props => (
        <button className="btn btn-primary" {...props}>
          <i className="far fa-copy pr-3" />
          <span>Copy</span>
        </button>
      );
      return (
        <div key="footer" className="modal-footer">
          <CopyToClipboard key={1} text={this.props.code} buttonBuilder={buttonBuilder} tooltipPosition="top" />
        </div>
      );
    }
    return null;
  }

  render() {
    return [
      <div key="body" className="modal-body">
        <pre style={{ height: 350 }}>{this.props.code}</pre>
      </div>,
      this.renderCopyToClipboard(),
    ];
  }
}
CodePopup.displayName = "CodePopup";
CodePopup.propTypes = {
  code: PropTypes.string,
};

export { CodePopup, renderCodePopupAnchor };
