import $ from "jquery";
import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

function canCopy() {
  return document.queryCommandSupported && document.queryCommandSupported("copy");
}

class CopyToClipboard extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (canCopy()) {
      const copy = e => {
        this.textArea.select();
        document.execCommand("copy");
        e.target.focus();
        $(e.target)
          .parent()
          .parent()
          .find(`div.copy-tt-${this.props.tooltipPosition}`)
          .fadeIn(300)
          .delay(300)
          .fadeOut(400);
      };
      return (
        <React.Fragment>
          <textarea
            ref={r => (this.textArea = r)}
            style={{ position: "absolute", left: -1 * window.innerWidth }}
            value={this.props.text || ""}
            onChange={_.noop}
          />
          <div className="hoverable-click">
            {this.props.buttonBuilder({ onClick: copy })}
            <div className={`hoverable__content copy-tt-${this.props.tooltipPosition}`}>{"Copied to clipboard"}</div>
          </div>
        </React.Fragment>
      );
    }
    return null;
  }
}
CopyToClipboard.displayName = "CopyToClipboard";
CopyToClipboard.propTypes = {
  text: PropTypes.string,
  buttonBuilder: PropTypes.func,
  tooltipPosition: PropTypes.string,
};
CopyToClipboard.defaultProps = { tooltipPosition: "bottom" };

export { CopyToClipboard, canCopy };
