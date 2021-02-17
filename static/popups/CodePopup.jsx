import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";

import { canCopy, CopyToClipboard } from "../CopyToClipboard";
import { JSAnchor } from "../JSAnchor";
import menuFuncs from "../dtale/menu/dataViewerMenuUtils";

require("./CodePopup.css");

function renderCodePopupAnchor(code, title) {
  const onClick = () => {
    window.code_popup = { code, title };
    menuFuncs.open("/dtale/code-popup", null, 450, 700);
  };
  return (
    <JSAnchor onClick={onClick}>
      <i className="ico-code pr-3" />
      <span>Code Export</span>
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
          <span>{this.props.t("Copy")}</span>
        </button>
      );
      return (
        <div key="footer" className="modal-footer">
          <CopyToClipboard text={this.props.code} buttonBuilder={buttonBuilder} tooltipPosition="top" />
        </div>
      );
    }
    return null;
  }

  render() {
    return [
      <div key="body" className="modal-body code-popup-modal">
        <SyntaxHighlighter language="python" style={docco}>
          {this.props.code || ""}
        </SyntaxHighlighter>
      </div>,
      this.renderCopyToClipboard(),
    ];
  }
}
CodePopup.displayName = "CodePopup";
CodePopup.propTypes = {
  code: PropTypes.string,
  t: PropTypes.func,
};
const TranslateCodePopup = withTranslation("code_export")(CodePopup);
export { TranslateCodePopup as CodePopup, renderCodePopupAnchor };
