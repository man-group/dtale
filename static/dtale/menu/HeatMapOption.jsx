import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { exports as gu } from "../gridUtils";
import { MenuItem } from "./MenuItem";

class HeatMapOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { backgroundMode, toggleBackground, t } = this.props;
    return (
      <MenuItem style={{ color: "#565b68" }} description={t("menu_description:heatmap")}>
        <span className="toggler-action">
          <i className={`fa fa-${gu.heatmapActive(backgroundMode) ? "fire-extinguisher" : "fire-alt"} ml-2 mr-4`} />
        </span>
        <span className={`font-weight-bold pl-2${gu.heatmapActive(backgroundMode) ? " flames" : ""}`}>
          {t("menu:Heat Map")}
        </span>
        <div className="btn-group compact ml-auto mr-3 font-weight-bold column-sorting" style={{ fontSize: "75%" }}>
          {_.map(
            [
              ["By Col", "heatmap-col"],
              ["Overall", "heatmap-all"],
            ],
            ([label, mode]) => (
              <button
                key={label}
                style={{ color: "#565b68" }}
                className="btn btn-primary font-weight-bold"
                onClick={toggleBackground(mode)}>
                {mode === backgroundMode && <span className="flames">{t(`menu:${label}`)}</span>}
                {mode !== backgroundMode && t(`menu:${label}`)}
              </button>
            )
          )}
        </div>
      </MenuItem>
    );
  }
}
HeatMapOption.displayName = "HeatMapOption";
HeatMapOption.propTypes = {
  backgroundMode: PropTypes.string,
  toggleBackground: PropTypes.func,
  t: PropTypes.func,
};

export default withTranslation(["menu", "menu_description"])(HeatMapOption);
