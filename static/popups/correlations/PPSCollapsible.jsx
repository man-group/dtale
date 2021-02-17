import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import Collapsible from "../../Collapsible";
import { default as PPSDetails, displayScore } from "../pps/PPSDetails";

class PPSCollapsible extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isOpen: false };
  }

  render() {
    const { ppsInfo, t } = this.props;
    if (!ppsInfo) {
      return null;
    }
    return (
      <div className="row">
        <div className="col-md-12 pr-0 pl-0">
          <Collapsible
            title={`${t("Predictive Power Score for ")}${ppsInfo.x} ${t("vs.")} ${ppsInfo.y}: ${displayScore(ppsInfo)}`}
            content={<PPSDetails ppsInfo={ppsInfo} />}
          />
        </div>
      </div>
    );
  }
}
PPSCollapsible.displayName = "PPSCollapsible";
PPSCollapsible.propTypes = { ppsInfo: PropTypes.object, t: PropTypes.func };

export default withTranslation("correlations")(PPSCollapsible);
