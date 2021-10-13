import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

import * as gu from "../gridUtils";
import { MenuItem } from "./MenuItem";

class ReactHeatMapOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { backgroundMode, showAllHeatmapColumns, toggleBackground, t } = this.props;
    const heatmapActive = gu.heatmapActive(backgroundMode) || gu.heatmapAllActive(backgroundMode);
    return (
      <MenuItem style={{ color: "#565b68" }} description={t("menu_description:heatmap")}>
        <span className="toggler-action">
          <i className={`fa fa-${heatmapActive ? "fire-extinguisher" : "fire-alt"} ml-2 mr-4`} />
        </span>
        <span className={`font-weight-bold pl-2${heatmapActive ? " flames" : ""}`}>
          {t("Heat Map", { ns: "menu" })}
        </span>
        <div className="btn-group compact ml-auto mr-3 font-weight-bold column-sorting" style={{ fontSize: "75%" }}>
          {_.map(
            [
              ["By Col", `heatmap-col${showAllHeatmapColumns ? "-all" : ""}`],
              ["Overall", `heatmap-all${showAllHeatmapColumns ? "-all" : ""}`],
            ],
            ([label, mode]) => (
              <button
                key={label}
                style={{ color: "#565b68" }}
                className="btn btn-primary font-weight-bold"
                onClick={toggleBackground(mode)}>
                {mode === backgroundMode && <span className="flames">{t(label, { ns: "menu" })}</span>}
                {mode !== backgroundMode && t(label, { ns: "menu" })}
              </button>
            )
          )}
        </div>
      </MenuItem>
    );
  }
}
ReactHeatMapOption.displayName = "ReactHeatMapOption";
ReactHeatMapOption.propTypes = {
  backgroundMode: PropTypes.string,
  showAllHeatmapColumns: PropTypes.bool,
  toggleBackground: PropTypes.func,
  t: PropTypes.func,
};

const TranslatedHeatMapOption = withTranslation(["menu", "menu_description"])(ReactHeatMapOption);

const ReduxHeatMapOption = connect(({ showAllHeatmapColumns }) => ({
  showAllHeatmapColumns,
}))(TranslatedHeatMapOption);

export { ReduxHeatMapOption as HeatMapOption, TranslatedHeatMapOption as ReactHeatMapOption };
