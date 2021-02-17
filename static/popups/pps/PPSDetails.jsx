import _ from "lodash";
import numeral from "numeral";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

export function displayScore(pps) {
  return pps?.is_valid_score === true ? numeral(pps.ppscore).format("0.00") : "N/A";
}

class PPSDetails extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { ppsInfo, t } = this.props;
    if (_.isEmpty(ppsInfo)) {
      return null;
    }
    const buildSpan = text => <span className="font-weight-bold">{text}</span>;
    return (
      <ul className="ppscore-descriptors">
        <li>
          {`${t("Baseline Score")}: `}
          {buildSpan(numeral(ppsInfo.baseline_score).format("0,000.00"))}
        </li>
        <li>
          {`${t("Case")}: `}
          {buildSpan(ppsInfo.case)}
        </li>
        <li>
          {`${t("Is Valid Score")}: `}
          {buildSpan(ppsInfo.is_valid_score === "True" ? "Yes" : "No")}
        </li>
        <li>
          {`${t("Score")}: `}
          {buildSpan(displayScore(ppsInfo))}
        </li>
        <li>
          {`${t("Metric")}: `}
          {buildSpan(ppsInfo.metric)}
        </li>
        <li>
          {`${t("Model")}: `}
          {buildSpan(ppsInfo.model)}
        </li>
        <li>
          {`${t("Model Score")}: `}
          {buildSpan(numeral(ppsInfo.model_score).format("0,000.00"))}
        </li>
      </ul>
    );
  }
}
PPSDetails.displayName = "PPSDetails";
PPSDetails.propTypes = {
  ppsInfo: PropTypes.object,
  t: PropTypes.func,
};
export default withTranslation("pps")(PPSDetails);
