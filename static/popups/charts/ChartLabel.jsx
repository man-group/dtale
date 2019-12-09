import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

class ChartLabel extends React.Component {
  render() {
    const { x, y, group, aggregation } = this.props;
    let labelStr = aggregation ? `${aggregation.label} of ${y.value}` : y.value;
    labelStr = `${labelStr} by ${x.value}`;
    if (!_.isEmpty(group)) {
      labelStr = `${labelStr} grouped by ${_.join(_.map(group, "value"), ", ")}`;
    }
    return (
      <div className="pt-5 pb-5 inline">
        <b style={{ color: "black" }}>{labelStr}</b>
      </div>
    );
  }
}
ChartLabel.displayName = "ChartLabel";
ChartLabel.propTypes = {
  x: PropTypes.object,
  y: PropTypes.object,
  group: PropTypes.arrayOf(PropTypes.object),
  aggregation: PropTypes.object,
};

export default ChartLabel;
