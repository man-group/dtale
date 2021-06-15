import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

class Uniques extends React.Component {
  render() {
    const { uniques, dtype, baseTitle, t } = this.props;
    if (_.isEmpty(uniques.data)) {
      return null;
    }
    let title = `${t(baseTitle)} ${t("Values")}`;
    if (dtype) {
      title = `${title} ${t("of type")} '${dtype}'`;
    }
    if (uniques.top) {
      title = `${title} (${t("top 100 most common")})`;
    }
    return (
      <div key={dtype} className="row">
        <div className="col-sm-12">
          <span className="font-weight-bold" style={{ fontSize: "120%" }}>
            {`${title}:`}
          </span>
          <br />
          <span>
            {_.join(
              _.map(uniques.data, u => `${u.value} (${u.count})`),
              ", "
            )}
          </span>
        </div>
      </div>
    );
  }
}
Uniques.displayName = "Uniques";
Uniques.defaultProps = { baseTitle: "Unique Row" };
Uniques.propTypes = {
  uniques: PropTypes.object,
  dtype: PropTypes.string,
  baseTitle: PropTypes.string,
  t: PropTypes.func,
};
export default withTranslation("describe")(Uniques);
