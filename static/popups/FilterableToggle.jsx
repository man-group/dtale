import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

class ReactFilterableToggle extends React.Component {
  render() {
    const { hasFilters, filtered, propagateState, className, t } = this.props;
    if (!hasFilters) {
      return null;
    }
    return (
      <div className={`col-auto mt-auto mb-auto hoverable filtered ${className}`}>
        <span className="font-weight-bold pr-3">{t("Filtered")}:</span>
        <i
          className={`ico-check-box${filtered ? "" : "-outline-blank"} pointer`}
          onClick={() => propagateState({ filtered: !filtered })}
        />
        <div className="hoverable__content">{t("description")}</div>
      </div>
    );
  }
}
ReactFilterableToggle.displayName = "ReactFilterableToggle";
ReactFilterableToggle.propTypes = {
  hasFilters: PropTypes.bool,
  filtered: PropTypes.bool,
  propagateState: PropTypes.func,
  t: PropTypes.func,
  className: PropTypes.string,
};
ReactFilterableToggle.defaultProps = { className: "" };

const TranslateFilterableToggle = withTranslation(["filterable"])(ReactFilterableToggle);
export { TranslateFilterableToggle as FilterableToggle, ReactFilterableToggle };
