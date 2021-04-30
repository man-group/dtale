import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

class StructuredFilters extends React.Component {
  render() {
    const { dropFilter, filters, prop, label, t } = this.props;
    if (_.size(filters)) {
      return (
        <React.Fragment>
          <div className="font-weight-bold">{`${t("Active")} ${label}:`}</div>
          {_.map(filters, (v, k) => (
            <div key={k}>
              <i className="ico-cancel pointer mr-4" onClick={() => dropFilter(prop, k)} />
              <span className="align-middle">{`${v.query} and`}</span>
            </div>
          ))}
        </React.Fragment>
      );
    }
    return null;
  }
}
StructuredFilters.displayName = "StructuredFilters";
StructuredFilters.propTypes = {
  filters: PropTypes.object,
  prop: PropTypes.string,
  label: PropTypes.string,
  dropFilter: PropTypes.func,
  t: PropTypes.func,
};
export default withTranslation("filter")(StructuredFilters);
