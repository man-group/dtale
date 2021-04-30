import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

class PandasQueryHelp extends React.Component {
  render() {
    return (
      <button
        className="btn btn-secondary"
        onClick={e => {
          e.preventDefault();
          window.open(
            "https://pandas.pydata.org/pandas-docs/stable/user_guide/indexing.html#indexing-query",
            null,
            "titlebar=1,location=1,status=1,width=990,height=450"
          );
        }}>
        <span>{this.props.t("Help")}</span>
      </button>
    );
  }
}
PandasQueryHelp.displayName = "PandasQueryHelp";
PandasQueryHelp.propTypes = { t: PropTypes.func };
export default withTranslation("filter")(PandasQueryHelp);
