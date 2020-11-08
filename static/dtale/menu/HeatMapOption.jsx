import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import Descriptions from "../menu-descriptions.json";

class HeatMapOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { backgroundMode, toggleBackground } = this.props;
    const heatmapActive = _.startsWith(backgroundMode, "heatmap");
    return (
      <li className="hoverable" style={{ color: "#565b68" }}>
        <span className="toggler-action">
          <i className={`fa fa-${heatmapActive ? "fire-extinguisher" : "fire-alt"} ml-2 mr-4`} />
        </span>
        <span className={`font-weight-bold pl-2${heatmapActive ? "flames" : ""}`}>{"Heat Map"}</span>
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
                {mode === backgroundMode && <span className="flames">{label}</span>}
                {mode !== backgroundMode && label}
              </button>
            )
          )}
        </div>
        <div className="hoverable__content menu-description">{Descriptions.heatmap}</div>
      </li>
    );
  }
}
HeatMapOption.displayName = "HeatMapOption";
HeatMapOption.propTypes = {
  backgroundMode: PropTypes.string,
  toggleBackground: PropTypes.func,
};

export default HeatMapOption;
