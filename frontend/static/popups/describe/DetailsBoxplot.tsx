import { BoxPlotDataPoint } from '@sgratzl/chartjs-chart-boxplot';
import { ChartConfiguration, TooltipItem } from 'chart.js';
import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import * as chartUtils from '../../chartUtils';

import { DetailData } from './DescribeState';
import DetailsSequentialDiffs from './DetailsSequentialDiffs';
import { COUNT_STATS, POSITION_STATS, Stat } from './Stat';

/** chart.js boxplot data point properties */
interface BoxPlotStats {
  min?: number;
  max?: number;
  q1?: number;
  q3?: number;
  median?: number;
  mean?: number;
  outliers?: readonly number[];
  whiskerMax?: number;
  whiskerMin?: number;
}

/** Component properties of DetailsBoxplot */
interface DetailsBoxplotProps {
  details: DetailData;
  column: string;
}

const DetailsBoxplot: React.FC<DetailsBoxplotProps & WithTranslation> = ({ details, column, t }) => {
  const boxplot = React.useRef<chartUtils.ChartObj>();

  const createBoxplot = (): void => {
    const builder = (ctx: HTMLCanvasElement): chartUtils.ChartObj | undefined => {
      const { describe } = details || {};
      const convertToFloat = (val: string): number | undefined =>
        !val || ['nan', 'inf'].includes(val) ? undefined : parseFloat(`${val}`.replace(/,/g, ''));
      const chartData: BoxPlotStats = {
        q1: convertToFloat(describe['25%']),
        median: convertToFloat(describe['50%']),
        q3: convertToFloat(describe['75%']),
        min: convertToFloat(describe.min),
        max: convertToFloat(describe.max),
      };
      if (Object.keys(chartData).find((key) => (chartData as any)[key] === undefined)) {
        return undefined;
      }
      chartData.whiskerMin = chartData.min;
      chartData.whiskerMax = chartData.max;
      const mean = convertToFloat(describe.mean);
      if (mean !== undefined) {
        chartData.outliers = [mean];
      }
      return chartUtils.createChart(ctx, {
        type: 'boxplot',
        data: {
          labels: [column],
          datasets: [
            {
              label: column,
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
              borderColor: 'rgb(54, 162, 235)',
              borderWidth: 1,
              data: [chartData as BoxPlotDataPoint],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          title: { display: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: true,
              callbacks: {
                label: (context: TooltipItem<'boxplot'>) => {
                  const raw = context.raw as BoxPlotStats;
                  return [
                    `Min: ${raw.min}`,
                    `Q1: ${raw.q1}`,
                    `Median: ${raw.median}`,
                    `Q3: ${raw.q3}`,
                    `Max: ${raw.max}`,
                  ];
                },
              },
            },
          },
          scales: {
            y: { ticks: { min: chartData.min! - 1, max: chartData.max! + 1 } },
          },
        },
      } as ChartConfiguration<'boxplot', BoxPlotDataPoint[], string>);
    };
    const chart = chartUtils.chartWrapper('boxplot', boxplot.current, builder);
    boxplot.current = chart;
  };

  React.useEffect(() => {
    createBoxplot();
  }, []);

  React.useEffect(() => {
    createBoxplot();
  }, [details]);

  const describe = details.describe ?? {};
  const describeKeys = Object.keys(describe).filter(
    (key) => !['total_count', 'freq', 'skew', 'kurt', ...COUNT_STATS, ...POSITION_STATS].includes(key),
  );
  let dtypeCounts = null;
  if (details.dtype_counts) {
    dtypeCounts = (
      <li>
        <h4 className="mb-0">{t('Dtype Counts')}</h4>
        <ul>
          {details.dtype_counts.map(({ count, dtype }) => (
            <li key={dtype}>
              {dtype}: {count}
            </li>
          ))}
        </ul>
      </li>
    );
  }
  return (
    <div className="row">
      <div className="col-md-6">
        <ul>
          <Stat t={t} field="total_count" value={describe.total_count}>
            <ul>
              {COUNT_STATS.map((stat) => (
                <Stat key={stat} t={t} field={stat} value={describe[stat]} />
              ))}
            </ul>
          </Stat>
          {POSITION_STATS.map((k) => describe[k] !== undefined && <Stat key={k} t={t} field={k} value={describe[k]} />)}
          {describe.freq !== undefined && (
            <ul>
              <Stat t={t} field="freq" value={describe.freq} />
            </ul>
          )}
          {describeKeys.map((k) => (
            <Stat key={k} t={t} field={k} value={describe[k]} />
          ))}
          {details.string_metrics && (
            <React.Fragment>
              <li>
                <div>
                  <h4 className="d-inline">Characters</h4>
                </div>
                <ul>
                  <Stat t={t} field="Min # Chars" value={details.string_metrics.char_min} />
                  <Stat t={t} field="Average # Chars" value={details.string_metrics.char_mean} />
                  <Stat t={t} field="Max # Chars" value={details.string_metrics.char_max} />
                  <Stat t={t} field="STD # Chars" value={details.string_metrics.char_std} />
                  <Stat t={t} field="Rows w/ Spaces" value={details.string_metrics.with_space} />
                  <Stat t={t} field="Rows w/ Accent Chars" value={details.string_metrics.with_accent} />
                  <Stat t={t} field="Rows w/ Numeric Chars" value={details.string_metrics.with_num} />
                  <Stat t={t} field="Rows w/ Uppercase Chars" value={details.string_metrics.with_upper} />
                  <Stat t={t} field="Rows w/ Lowercase Chars" value={details.string_metrics.with_lower} />
                  <Stat t={t} field="Rows w/ Punctuation" value={details.string_metrics.with_punc} />
                  <Stat t={t} field="Rows Starting w/ Space" value={details.string_metrics.space_at_the_first} />
                  <Stat t={t} field="Rows Ending w/ Space" value={details.string_metrics.space_at_the_end} />
                  <Stat
                    t={t}
                    field="Rows w/ Multi Spacing"
                    value={details.string_metrics.multi_space_after_each_other}
                  />
                  <Stat t={t} field="Rows w/ Hidden Chars" value={details.string_metrics.with_hidden} />
                </ul>
              </li>
              <li>
                <div>
                  <h4 className="d-inline">{t('Words')}</h4>
                </div>
                <ul>
                  <Stat t={t} field="Min # Words" value={details.string_metrics.word_min} />
                  <Stat t={t} field="Average # Words" value={details.string_metrics.word_mean} />
                  <Stat t={t} field="Max # Words" value={details.string_metrics.word_max} />
                  <Stat t={t} field="STD # Words" value={details.string_metrics.word_std} />
                </ul>
              </li>
            </React.Fragment>
          )}
          {details.sequential_diffs && <DetailsSequentialDiffs data={details.sequential_diffs} column={column} />}
          {describe.kurt !== undefined && <Stat t={t} field="kurt" value={describe.kurt} />}
          {describe.skew !== undefined && <Stat t={t} field="skew" value={describe.skew} />}
          {dtypeCounts}
        </ul>
      </div>
      <div className="col-md-6">
        <div style={{ height: 300 }}>
          <canvas id="boxplot" />
        </div>
      </div>
    </div>
  );
};

export default withTranslation('describe')(DetailsBoxplot);
