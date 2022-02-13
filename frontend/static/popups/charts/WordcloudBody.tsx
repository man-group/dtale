import React from 'react';
import ReactWordcloud from 'react-wordcloud';

import { DataSpec } from '../../chartUtils';
import { BaseOption } from '../../redux/state/AppState';
import { truncate } from '../../stringUtils';

/** Component properties for WordcloudBody */
export interface WordcloudBodyProps {
  data?: DataSpec;
  y?: Array<BaseOption<string>>;
  group?: Array<BaseOption<string>>;
  chartType: BaseOption<string>;
  height: number;
}

const WordcloudBody: React.FC<WordcloudBodyProps> = ({ data, y, group, chartType, height }) => {
  if (chartType.value !== 'wordcloud') {
    return null;
  }
  const yProps = (y || []).map(({ value }) => value);
  const colWidth = Object.keys(data?.data ?? {}).length * yProps.length === 1 ? '12' : '6';
  return (
    <div className="row">
      {Object.keys(data?.data ?? {}).map((seriesKey) =>
        yProps.map((yProp) => {
          const series = data?.data?.[seriesKey];
          if (!(series?.[yProp] ?? []).length) {
            return null;
          }
          const labels = [];
          if (seriesKey !== 'all') {
            labels.push(seriesKey);
          }
          if (yProps.length > 1) {
            labels.push(yProp);
          }
          const hasLabel = labels.length > 0;
          return (
            <div key={`${seriesKey}-${yProp}`} className={`col-md-${colWidth}`} style={{ height }}>
              <div className="text-center" style={{ height }}>
                {hasLabel && <span className="font-weight-bold">{labels.join(' - ')}</span>}
                <div style={{ height: height - (hasLabel ? 15 : 0) }}>
                  <ReactWordcloud
                    options={{
                      fontFamily: '"Istok", "Helvetica", Arial, sans-serif',
                      enableTooltip: true,
                      fontSizes: [5, 35],
                      scale: 'log',
                      deterministic: true,
                      rotations: 1,
                      rotationAngles: [0, 0],
                      spiral: 'archimedean',
                      transitionDuration: 500,
                    }}
                    words={(series?.x ?? [])
                      .map((l, i) => {
                        const labelText = `${l}`;
                        return {
                          text: truncate(labelText, 24),
                          fullText: labelText,
                          value: Number(series?.[yProp][i]),
                        };
                      })
                      .sort((a, b) => {
                        if (a.value < b.value) {
                          return -1;
                        }
                        if (a.value > b.value) {
                          return 1;
                        }
                        return 0;
                      })}
                    callbacks={{
                      getWordTooltip: ({ fullText, value }) => `${fullText} (${value})`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        }),
      )}
    </div>
  );
};

export default WordcloudBody;
