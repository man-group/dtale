import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import * as actions from "../../actions/dtale";
import { MenuItem } from "./MenuItem";

class ReactShowNonNumericHeatmapColumns extends React.Component {
  constructor(props) {
    super(props);
    this.updateShowAllHeatmapColumns = this.updateShowAllHeatmapColumns.bind(this);
  }

  updateShowAllHeatmapColumns() {
    const { backgroundMode, showAllHeatmapColumns } = this.props;
    const updatedShowAllHeatmapColumns = !showAllHeatmapColumns;
    this.props.updateShowAllHeatmapColumns(updatedShowAllHeatmapColumns);
    if (_.includes(["heatmap-col", "heatmap-all"], backgroundMode) && updatedShowAllHeatmapColumns) {
      this.props.toggleBackground(`${backgroundMode}-all`)();
    } else if (_.includes(["heatmap-col-all", "heatmap-all-all"], backgroundMode) && !updatedShowAllHeatmapColumns) {
      this.props.toggleBackground(backgroundMode.substring(0, backgroundMode.length - 4))(); // trim off "-all"
    }
    this.props.hideRibbonMenu();
  }

  render() {
    const { showAllHeatmapColumns, t } = this.props;
    const iconClass = `ico-check-box${showAllHeatmapColumns ? "" : "-outline-blank"}`;
    return (
      <MenuItem
        className="hoverable"
        description={t("menu_description:show_all_heatmap")}
        onClick={this.updateShowAllHeatmapColumns}>
        <span className="toggler-action">
          <button className="btn btn-plain">
            <i className={iconClass} style={{ marginTop: "-.25em" }} />
            <span className="font-weight-bold" style={{ fontSize: "95%" }}>
              {t("Show All Heatmap Columns", { ns: "menu" })}
            </span>
          </button>
        </span>
      </MenuItem>
    );
  }
}
ReactShowNonNumericHeatmapColumns.displayName = "ShowNonNumericHeatmapColumns";
ReactShowNonNumericHeatmapColumns.propTypes = {
  backgroundMode: PropTypes.string,
  showAllHeatmapColumns: PropTypes.bool,
  updateShowAllHeatmapColumns: PropTypes.func,
  toggleBackground: PropTypes.func,
  hideRibbonMenu: PropTypes.func,
  t: PropTypes.func,
};

const TranslatedShowNonNumericHeatmapColumns = withTranslation(["menu", "menu_description"])(
  ReactShowNonNumericHeatmapColumns
);
const ReduxShowNonNumericHeatmapColumns = connect(
  ({ showAllHeatmapColumns }) => ({ showAllHeatmapColumns }),
  dispatch => ({
    updateShowAllHeatmapColumns: showAll => dispatch(actions.updateShowAllHeatmapColumns(showAll)),
    hideRibbonMenu: () => dispatch({ type: "hide-ribbon-menu" }),
  })
)(TranslatedShowNonNumericHeatmapColumns);

export {
  ReduxShowNonNumericHeatmapColumns as ShowNonNumericHeatmapColumns,
  TranslatedShowNonNumericHeatmapColumns as ReactShowNonNumericHeatmapColumns,
};
