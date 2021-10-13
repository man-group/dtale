import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import { MenuItem } from "./MenuItem";

class ReactPredefinedFiltersOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { predefinedFilters, open, t } = this.props;
    if (_.size(predefinedFilters) > 0) {
      return (
        <MenuItem description={t("menu_description:predefined_filters")} onClick={open}>
          <span className="toggler-action">
            <button className="btn btn-plain">
              <i className="fa fa-filter ml-2 mr-4" />
              <span className="font-weight-bold">{t("Predefined Filters", { ns: "menu" })}</span>
            </button>
          </span>
        </MenuItem>
      );
    }
    return null;
  }
}
ReactPredefinedFiltersOption.displayName = "ReactPredefinedFiltersOption";
ReactPredefinedFiltersOption.propTypes = {
  predefinedFilters: PropTypes.array,
  open: PropTypes.func,
  t: PropTypes.func,
};
const TranslatedPredefinedFiltersOption = withTranslation(["menu", "menu_description"])(ReactPredefinedFiltersOption);
const ReduxPredefinedFiltersOption = connect(({ predefinedFilters }) => ({
  predefinedFilters,
}))(TranslatedPredefinedFiltersOption);
export {
  ReduxPredefinedFiltersOption as PredefinedFiltersOption,
  TranslatedPredefinedFiltersOption as ReactPredefinedFiltersOption,
};
