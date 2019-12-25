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
      <div className="text-center" style={{ height: this.props.height }}>
        {seriesKey !== "all" && <span className="font-weight-bold">{seriesKey}</span>}
        <div style={{ height: this.props.height - (seriesKey === "all" ? 0 : 15) }}>
          <ReactWordcloud
            options={{
              fontFamily: '"Istok", "Helvetica", Arial, sans-serif',
              enableTooltip: true,
              fontSizes: [5, 35],
              scale: "log",
              deterministic: true,
              rotations: 1,
              rotationAngles: [0],
              spiral: "archimedean",
              transitionDuration: 500,
            }}
            words={_.sortBy(
              _.map(series.x, (l, i) => ({
                text: _.truncate(l + "", { length: 24 }),
                fullText: l + "",
                value: series.y[i],
              })),
              "value"
            )}
            callbacks={{
              getWordTooltip: ({ fullText, value }) => `${fullText} (${value})`,
            }}
          />
        </div>
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
  height: PropTypes.number,
};
export default WordcloudBody;
