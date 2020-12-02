import PropTypes from "prop-types";
import React from "react";

import { default as PPSDetails, displayScore } from "../pps/PPSDetails";

require("./PPSCollapsible.scss");

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
    const { isOpen } = this.state;
    const onClick = () => this.setState({ isOpen: !this.state.isOpen });
    return (
      <div className="row">
        <div className="col-md-12 pr-0 pl-0">
          <dl className="accordion pt-3">
            <dt className={`accordion-title${isOpen ? " is-expanded" : ""} pointer pl-3`} onClick={onClick}>
              {`Predictive Power Score for ${ppsInfo.x} vs. ${ppsInfo.y}: ${displayScore(ppsInfo)}`}
            </dt>
            <dd className={`accordion-content${isOpen ? " is-expanded" : ""}`} onClick={onClick}>
              <PPSDetails ppsInfo={ppsInfo} />
            </dd>
          </dl>
        </div>
      </div>
    );
  }
}
PPSCollapsible.displayName = "PPSCollapsible";
PPSCollapsible.propTypes = { ppsInfo: PropTypes.object };

export default PPSCollapsible;
