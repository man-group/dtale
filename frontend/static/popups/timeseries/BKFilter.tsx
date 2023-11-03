import { ChartConfiguration } from 'chart.js';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import * as chartUtils from '../../chartUtils';
import { CreateColumnCodeSnippet } from '../create/CodeSnippet';
import { LabeledInput } from '../create/LabeledInput';

import { buildCode as buildBaseCode, validate as validateBase } from './BaseInputs';
import { BaseComponentProps, BaseTimeseriesConfig, BKConfig } from './TimeseriesAnalysisState';

export const validate = (cfg: BKConfig & BaseTimeseriesConfig): string | undefined => {
  const error = validateBase(cfg);
  if (error) {
    return error;
  }
  const { low, high, K } = cfg;
  if (!low) {
    return 'Please enter a low!';
  }
  if (!high) {
    return 'Please enter a high!';
  }
  if (!K) {
    return 'Please enter K!';
  }
  return undefined;
};

export const buildCode = (cfg: BKConfig & BaseTimeseriesConfig): CreateColumnCodeSnippet => {
  const { low, high, K } = cfg;
  if (validateBase(cfg)) {
    return undefined;
  }
  return [
    'from statsmodels.tsa.filters.bk_filter import bkfilter',
    '',
    buildBaseCode(cfg),
    `cycle = bkfilter(s, ${low}, ${high}, ${K})`,
  ];
};

export const CHART_COLS = ['cycle'];

export const chartConfigBuilder = (
  config: BaseTimeseriesConfig,
  chartConfig: Partial<ChartConfiguration<'line'>>,
): Partial<ChartConfiguration<'line'>> => {
  chartConfig.data = {
    ...chartConfig.data,
    datasets: (chartConfig.data?.datasets ?? []).slice(0, 2).map((dataset, i) => {
      chartUtils.updateColorProps(dataset, chartUtils.TS_COLORS[i]);
      return { ...dataset };
    }),
  };
  chartConfig.options = {
    ...chartConfig.options,
    scales: {
      [`y-${config.col}`]: { ...chartConfig.options?.scales?.[`y-${config.col}`], position: 'left' },
      ['y-cycle']: { ...chartConfig.options?.scales?.['y-cycle'], position: 'right' },
      x: { ...chartConfig.options?.scales?.x, title: { display: false } },
    },
  };
  chartConfig.options = {
    ...chartConfig.options,
    plugins: { ...chartConfig.options?.plugins, legend: { display: true } },
  };
  return chartConfig;
};

const BKFilter: React.FC<BaseComponentProps<BKConfig> & WithTranslation> = ({ cfg, updateState, t }) => {
  const [low, setLow] = React.useState(cfg?.low);
  const [high, setHigh] = React.useState(cfg?.high);
  const [K, setK] = React.useState(cfg?.K);

  React.useEffect(() => {
    updateState({ low, high, K });
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && Number(e.currentTarget.value)) {
      updateState({ low, high, K });
    }
  };

  return (
    <React.Fragment>
      <div className="col-md-4">
        <LabeledInput
          label={t('Low', { ns: 'timeseries' })}
          value={low}
          setter={(value) => setLow(Number(value))}
          inputOptions={{ onKeyDown }}
          subLabel="(Press ENTER to submit)"
          tooltip={t(`low_desc`, { ns: 'timeseries' })}
        />
      </div>
      <div className="col-md-4">
        <LabeledInput
          label={t('High', { ns: 'timeseries' })}
          value={high}
          setter={(value) => setHigh(Number(value))}
          inputOptions={{ onKeyDown }}
          subLabel="(Press ENTER to submit)"
          tooltip={t(`high_desc`, { ns: 'timeseries' })}
        />
      </div>
      <div className="col-md-4">
        <LabeledInput
          label={t('K', { ns: 'timeseries' })}
          value={K}
          setter={(value) => setK(Number(value))}
          inputOptions={{ onKeyDown }}
          subLabel="(Press ENTER to submit)"
          tooltip={t(`K_desc`, { ns: 'timeseries' })}
        />
      </div>
    </React.Fragment>
  );
};
export default withTranslation(['timeseries', 'constants'])(BKFilter);
