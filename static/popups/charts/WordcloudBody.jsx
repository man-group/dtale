import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import ReactWordcloud from "react-wordcloud";

class WordcloudBody extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { chartType, seriesKey } = this.props;
    if (chartType !== "wordcloud") {
      return null;
    }
    const series = _.get(this.props, ["data", "data", seriesKey], {});
    if (_.isEmpty(series)) {
      return null;
    }
    return (
      <div className="text-center">
        {seriesKey !== "all" && <span className="font-weight-bold">{seriesKey}</span>}
        <ReactWordcloud
          options={{
            fontFamily: '"Istok", "Helvetica", Arial, sans-serif',
            enableTooltip: true,
            fontSizes: [5, 60],
            scale: "linear",
            deterministic: true,
            rotations: 1,
            rotationAngles: [0, 90],
            transitionDuration: 500,
          }}
          words={_.map(series.x, (l, i) => ({
            text: l + "",
            value: series.y[i],
          }))}
        />
      </div>
    );
  }
}

WordcloudBody.displayName = "WordcloudBody";
WordcloudBody.propTypes = {
  data: PropTypes.object, // eslint-disable-line react/no-unused-prop-types
  seriesKey: PropTypes.string,
  group: PropTypes.string, // eslint-disable-line react/no-unused-prop-types
  chartType: PropTypes.string,
};
export default WordcloudBody;
