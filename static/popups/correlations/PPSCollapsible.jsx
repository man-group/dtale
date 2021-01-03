import PropTypes from "prop-types";
import React from "react";

import Collapsible from "../../Collapsible";
import { default as PPSDetails, displayScore } from "../pps/PPSDetails";

class PPSCollapsible extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isOpen: false };
  }

  render() {
    const { ppsInfo } = this.props;
    if (!ppsInfo) {
      return null;
    }
    return (
      <div className="row">
        <div className="col-md-12 pr-0 pl-0">
          <Collapsible
            title={`Predictive Power Score for ${ppsInfo.x} vs. ${ppsInfo.y}: ${displayScore(ppsInfo)}`}
            content={<PPSDetails ppsInfo={ppsInfo} />}
          />
        </div>
      </div>
    );
  }
}
PPSCollapsible.displayName = "PPSCollapsible";
PPSCollapsible.propTypes = { ppsInfo: PropTypes.object };

export default PPSCollapsible;
