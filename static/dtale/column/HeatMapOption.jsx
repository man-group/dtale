import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import bu from "../backgroundUtils";

class HeatMapOption extends React.Component {
  constructor(props) {
    super(props);
    this.state = { heatmapType: `heatmap-col-${props.selectedCol}` };
    this.toggleBackground = this.toggleBackground.bind(this);
  }

  toggleBackground() {
    const { heatmapType } = this.state;
    const { backgroundMode } = this.props;
    this.props.propagateState({
      backgroundMode: backgroundMode === heatmapType ? null : heatmapType,
      triggerBgResize: _.includes(bu.RESIZABLE, backgroundMode),
    });
  }

  render() {
    const { backgroundMode, colCfg, t } = this.props;
    if (!_.has(colCfg, "min")) {
      return null;
    }
    const heatmapActive = backgroundMode === this.state.heatmapType;
    return (
      <li>
        <span className="toggler-action">
          <button className="btn btn-plain" onClick={this.toggleBackground}>
            <i className={`fa fa-${heatmapActive ? "fire-extinguisher" : "fire-alt"} ml-2 mr-4`} />
            <span className={`font-weight-bold pl-3${heatmapActive ? " flames" : ""}`}>
              {t("Heat Map", { ns: "menu" })}
            </span>
          </button>
        </span>
      </li>
    );
  }
}
HeatMapOption.displayName = "HeatMapOption";
HeatMapOption.propTypes = {
  selectedCol: PropTypes.string,
  backgroundMode: PropTypes.string,
  propagateState: PropTypes.func,
  colCfg: PropTypes.object,
  t: PropTypes.func,
};

export default withTranslation("menu")(HeatMapOption);
