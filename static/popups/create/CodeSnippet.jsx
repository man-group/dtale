import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

class CodeSnippet extends React.Component {
  render() {
    const { isWindow, t } = this.props;
    if (this.props.code) {
      const code = _.concat(this.props.code, []);
      let markup = null;
      if (_.size(code) > 2) {
        markup = (
          <div className="font-weight-bold hoverable">
            <div>{code[0]}</div>
            <div>{code[1]}</div>
            <div style={{ fontSize: "85%" }}>{t("hover to see more...", { ns: "builders" })}</div>
            <div className={`hoverable__content build-code${isWindow ? "-window" : ""}`}>
              <pre className="mb-0">{_.join(code, "\n")}</pre>
            </div>
          </div>
        );
      } else {
        markup = (
          <div className="font-weight-bold">
            {_.map(code, (c, i) => (
              <div key={i}>{c}</div>
            ))}
          </div>
        );
      }
      return (
        <>
          <div className="col-auto" style={{ paddingRight: 0 }}>
            <span className="pr-3">{t("Code", { ns: "reshape" })}:</span>
            {markup}
          </div>
          <div className="col" />
        </>
      );
    }
    return null;
  }
}
CodeSnippet.displayName = "CodeSnippet";
CodeSnippet.propTypes = {
  code: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
  isWindow: PropTypes.bool,
  t: PropTypes.func,
};
CodeSnippet.defaultProps = { isWindow: false };
export default withTranslation(["reshape", "builders"])(CodeSnippet);
