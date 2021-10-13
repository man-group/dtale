import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import { openChart } from "../../actions/charts";
import { MenuItem } from "./MenuItem";

function renderDimensionSelection(dimensionSelection, t) {
  if (_.size(dimensionSelection)) {
    return _.join(
      _.map(dimensionSelection, (val, prop) => `${val} (${prop})`),
      ", "
    );
  }
  return t("ALL DATA", { ns: "menu" });
}

class ReactXArrayOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { t, xarray, xarrayDim } = this.props;
    const openXArrayPopup = type => this.props.openChart(_.assignIn({ type }, this.props));
    if (xarray) {
      return (
        <MenuItem
          description={`${t("menu_description:xarray_dim_des")} ${renderDimensionSelection(xarrayDim, t)}`}
          onClick={() => openXArrayPopup("xarray-dimensions")}>
          <span className="toggler-action">
            <button className="btn btn-plain">
              <i className="ico-key" />
              <span className="font-weight-bold">{t("XArray Dimensions", { ns: "menu" })}</span>
            </button>
          </span>
        </MenuItem>
      );
    }
    return (
      <MenuItem description={t("menu_description:xarray_conversion")} onClick={() => openXArrayPopup("xarray-indexes")}>
        <span className="toggler-action">
          <button className="btn btn-plain">
            <i className="ico-tune" />
            <span className="font-weight-bold">{t("Convert To XArray", { ns: "menu" })}</span>
          </button>
        </span>
      </MenuItem>
    );
  }
}
ReactXArrayOption.displayName = "ReactXArrayOption";
ReactXArrayOption.propTypes = {
  columns: PropTypes.array, // eslint-disable-line react/no-unused-prop-types
  xarray: PropTypes.bool,
  xarrayDim: PropTypes.object,
  openChart: PropTypes.func,
  t: PropTypes.func,
};

const TranslatedReactXArrayOption = withTranslation(["menu", "menu_description"])(ReactXArrayOption);
const ReduxXArrayOption = connect(
  state => _.pick(state, ["xarray", "xarrayDim"]),
  dispatch => ({ openChart: chartProps => dispatch(openChart(chartProps)) })
)(TranslatedReactXArrayOption);

export { ReduxXArrayOption as XArrayOption, TranslatedReactXArrayOption as ReactXArrayOption };
