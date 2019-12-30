import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import { AGGREGATION_OPTS, ROLLING_COMPS } from "./Aggregations";

function buildLabel({ x, y, group, aggregation, rollingWindow, rollingComputation }) {
  const yLabel = _.join(_.map(y, "value"), ", ");
  let labelStr = yLabel;
  if (aggregation) {
    const aggLabel = _.find(AGGREGATION_OPTS, { value: aggregation }).label;
    if (aggregation === "rolling") {
      const compLabel = _.find(ROLLING_COMPS, { value: rollingComputation }).label;
      labelStr = `${aggLabel} ${compLabel} (window: ${rollingWindow}) of ${yLabel}`;
    } else {
      labelStr = `${aggLabel} of ${yLabel}`;
    }
  }
  labelStr = `${labelStr} by ${_.get(x, "value")}`;
  if (!_.isEmpty(group)) {
    labelStr = `${labelStr} grouped by ${_.join(_.map(group, "value"), ", ")}`;
  }
  return labelStr;
}

class ChartLabel extends React.Component {
  constructor(props) {
    super(props);
    this.state = { label: buildLabel(this.props) };
  }

  componentDidUpdate(prevProps) {
    if (this.props.url !== prevProps.url) {
      this.setState({ label: buildLabel(this.props) });
    }
  }

  render() {
    return (
      <div className="pt-5 pb-5 inline">
        <b style={{ color: "black" }}>{this.state.label}</b>
      </div>
    );
  }
}
ChartLabel.displayName = "ChartLabel";
ChartLabel.propTypes = {
  url: PropTypes.string,
  x: PropTypes.object, // eslint-disable-line react/no-unused-prop-types
  y: PropTypes.arrayOf(PropTypes.object), // eslint-disable-line react/no-unused-prop-types
  group: PropTypes.arrayOf(PropTypes.object), // eslint-disable-line react/no-unused-prop-types
  aggregation: PropTypes.string, // eslint-disable-line react/no-unused-prop-types
};

export default ChartLabel;
