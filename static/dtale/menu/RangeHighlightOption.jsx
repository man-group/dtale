import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { Bouncer } from "../../Bouncer";
import { MenuItem } from "./MenuItem";

class RangeHighlightOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const openRangeHightlight = this.props.ribbonWrapper(() =>
      this.props.openChart(_.assignIn({ type: "range", size: "sm" }, this.props))
    );
    const turnOffRangeHighlight = this.props.ribbonWrapper(() => {
      const rangeHighlight = { ...this.props.rangeHighlight };
      _.forEach(rangeHighlight, range => {
        range.active = false;
      });
      this.props.propagateState({ rangeHighlight, backgroundMode: null });
    });
    return (
      <MenuItem description={this.props.t("menu_description:highlight_range")} onClick={openRangeHightlight}>
        <span className="toggler-action">
          <button className="btn btn-plain">
            <div style={{ display: "inherit" }}>
              {this.props.backgroundMode === "range" && (
                <div className="bg-range-bouncer">
                  <Bouncer />
                </div>
              )}
              {this.props.backgroundMode !== "range" && <div className="bg-range-icon" />}
              <span className="font-weight-bold pl-4">{this.props.t("Highlight Range", { ns: "menu" })}</span>
            </div>
          </button>
        </span>
        {this.props.backgroundMode === "range" && (
          <div className="ml-auto mt-auto mb-auto">
            <i className="ico-close-circle pointer mr-3 btn-plain" onClick={turnOffRangeHighlight} />
          </div>
        )}
      </MenuItem>
    );
  }
}
RangeHighlightOption.displayName = "RangeHighlightOption";
RangeHighlightOption.propTypes = {
  backgroundMode: PropTypes.string,
  rangeHighlight: PropTypes.object,
  propagateState: PropTypes.func,
  openChart: PropTypes.func,
  ribbonWrapper: PropTypes.func,
  t: PropTypes.func,
};
RangeHighlightOption.defaultProps = { ribbonWrapper: func => func };

export default withTranslation(["menu", "menu_description"])(RangeHighlightOption);
