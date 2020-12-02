import _ from "lodash";
import numeral from "numeral";
import PropTypes from "prop-types";
import React from "react";

export function displayScore(pps) {
  return pps?.is_valid_score === true ? numeral(pps.ppscore).format("0.00") : "N/A";
}

export default class PPSDetails extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { ppsInfo } = this.props;
    if (_.isEmpty(ppsInfo)) {
      return null;
    }
    const buildSpan = text => <span className="font-weight-bold">{text}</span>;
    return (
      <ul className="ppscore-descriptors">
        <li>
          {"Baseline Score: "}
          {buildSpan(numeral(ppsInfo.baseline_score).format("0,000.00"))}
        </li>
        <li>
          {"Case: "}
          {buildSpan(ppsInfo.case)}
        </li>
        <li>
          {"Is Valid Score: "}
          {buildSpan(ppsInfo.is_valid_score ? "Yes" : "No")}
        </li>
        <li>
          {"Score: "}
          {buildSpan(displayScore(ppsInfo))}
        </li>
        <li>
          {"Metric: "}
          {buildSpan(ppsInfo.metric)}
        </li>
        <li>
          {"Model: "}
          {buildSpan(ppsInfo.model)}
        </li>
        <li>
          {"Model Score: "}
          {buildSpan(numeral(ppsInfo.model_score).format("0,000.00"))}
        </li>
      </ul>
    );
  }
}
PPSDetails.displayName = "PPSDetails";
PPSDetails.propTypes = {
  ppsInfo: PropTypes.object,
};
