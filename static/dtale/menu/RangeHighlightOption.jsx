import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import { Bouncer } from "../../Bouncer";
import Descriptions from "../menu-descriptions.json";

class RangeHighlightOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const openRangeHightlight = () => this.props.openChart(_.assignIn({ type: "range", size: "modal-sm" }, this.props));
    const turnOffRangeHighlight = () => {
      const rangeHighlight = { ...this.props.rangeHighlight };
      _.forEach(rangeHighlight, range => {
        range.active = false;
      });
      this.props.propagateState({ rangeHighlight, backgroundMode: null });
    };
    return (
      <li className="hoverable">
        <span className="toggler-action">
          <button className="btn btn-plain" onClick={openRangeHightlight}>
            <div style={{ display: "inherit" }}>
              {this.props.backgroundMode === "range" && (
                <div className="bg-range-bouncer">
                  <Bouncer />
                </div>
              )}
              {this.props.backgroundMode !== "range" && <div className="bg-range-icon" />}
              <span className="font-weight-bold pl-4">Highlight Range</span>
            </div>
          </button>
        </span>
        {this.props.backgroundMode === "range" && (
          <div className="ml-auto mt-auto mb-auto">
            <i className="ico-close-circle pointer mr-3 btn-plain" onClick={turnOffRangeHighlight} />
          </div>
        )}
        <div className="hoverable__content menu-description">{Descriptions.highlight_range}</div>
      </li>
    );
  }
}
RangeHighlightOption.displayName = "RangeHighlightOption";
RangeHighlightOption.propTypes = {
  backgroundMode: PropTypes.string,
  rangeHighlight: PropTypes.object,
  propagateState: PropTypes.func,
  openChart: PropTypes.func,
};

export default RangeHighlightOption;
