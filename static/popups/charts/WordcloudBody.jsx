import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import ReactWordcloud from "react-wordcloud";

class WordcloudBody extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { chartType, y } = this.props;
    if (chartType.value !== "wordcloud") {
      return null;
    }
    const yProps = _.map(y || [], "value");
    const colWidth = _.size(_.get(this.props, "data.data", {})) * _.size(yProps) == 1 ? "12" : "6";
    return (
      <div className="row">
        {_.flatMap(_.get(this.props, "data.data", {}), (series, seriesKey) =>
          _.map(yProps, yProp => {
            if (_.isEmpty(series[yProp] || [])) {
              return null;
            }
            const labels = [];
            if (seriesKey !== "all") {
              labels.push(seriesKey);
            }
            if (_.size(yProps) > 1) {
              labels.push(yProp);
            }
            const hasLabel = _.size(labels) > 0;
            return (
              <div key={`${seriesKey}-${yProp}`} className={`col-md-${colWidth}`} style={{ height: this.props.height }}>
                <div className="text-center" style={{ height: this.props.height }}>
                  {hasLabel && <span className="font-weight-bold">{_.join(labels, " - ")}</span>}
                  <div style={{ height: this.props.height - (hasLabel ? 15 : 0) }}>
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
                        _.map(series.x, (l, i) => {
                          const labelText = l + "";
                          return {
                            text: _.truncate(labelText, { length: 24 }),
                            fullText: labelText,
                            value: series[yProp][i],
                          };
                        }),
                        "value"
                      )}
                      callbacks={{
                        getWordTooltip: ({ fullText, value }) => `${fullText} (${value})`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }
}

WordcloudBody.displayName = "WordcloudBody";
WordcloudBody.propTypes = {
  data: PropTypes.object, // eslint-disable-line react/no-unused-prop-types
  y: PropTypes.arrayOf(PropTypes.object),
  group: PropTypes.arrayOf(PropTypes.object), // eslint-disable-line react/no-unused-prop-types
  chartType: PropTypes.object,
  height: PropTypes.number,
};
export default WordcloudBody;
