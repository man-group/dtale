import { ChartConfiguration } from 'chart.js';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import * as chartUtils from '../../chartUtils';
import { CreateColumnCodeSnippet } from '../create/CodeSnippet';
import { LabeledInput } from '../create/LabeledInput';

import { buildCode as buildBaseCode, validate as validateBase } from './BaseInputs';
import { BaseComponentProps, BaseTimeseriesConfig, HPConfig } from './TimeseriesAnalysisState';

export const validate = (cfg: HPConfig & BaseTimeseriesConfig): string | undefined => {
  const error = validateBase(cfg);
  if (error) {
    return error;
  }
  if (!cfg.lamb) {
    return 'Please enter a lambda!';
  }
  return undefined;
};

export const buildCode = (cfg: HPConfig & BaseTimeseriesConfig): CreateColumnCodeSnippet => {
  if (validateBase(cfg)) {
    return undefined;
  }
  return [
    'from statsmodels.tsa.filters.hp_filter import hpfilter',
    '',
    buildBaseCode(cfg),
    `cycle, trend = hpfilter(s, lamb=${cfg.lamb})`,
  ];
};

export const CHART_COLS = ['cycle', 'trend'];

export const chartConfigBuilder = (
  config: BaseTimeseriesConfig,
  chartConfig: Partial<ChartConfiguration<'line'>>,
): Partial<ChartConfiguration<'line'>> => {
  const { col } = config;
  chartConfig.data = {
    ...chartConfig.data,
    datasets: (chartConfig.data?.datasets ?? []).slice(0, 3).map((dataset, i) => {
      chartUtils.updateColorProps(dataset, chartUtils.TS_COLORS[i]);
      return i === 1 ? { ...dataset, yAxisID: `y-${col}` } : { ...dataset };
    }),
  };
  chartConfig.options = {
    ...chartConfig.options,
    scales: {
      [`y-${col}`]: {
        ...chartConfig.options?.scales?.[`y-${col}`],
        position: 'left',
        title: { text: `${col}, trend` },
      },
      ['y-cycle']: { ...chartConfig.options?.scales?.['y-cycle'], position: 'right' },
      ['y-trend']: { ...chartConfig.options?.scales?.['y-trend'], display: false },
      x: { ...chartConfig.options?.scales?.x, title: { display: false } },
    },
  };
  chartConfig.options = {
    ...chartConfig.options,
    plugins: { ...chartConfig.options?.plugins, legend: { display: true } },
  };
  return chartConfig;
};

const HPFilter: React.FC<BaseComponentProps<HPConfig> & WithTranslation> = ({ cfg, updateState, t }) => {
  const [lamb, setLamb] = React.useState(cfg?.lamb);

  React.useEffect(() => {
    updateState({ lamb });
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && Number(e.currentTarget.value)) {
      updateState({ lamb });
    }
  };

  return (
    <div className="col-md-4">
      <LabeledInput
        label={t('Lambda', { ns: 'timeseries' })}
        value={lamb}
        setter={(value) => setLamb(Number(value))}
        inputOptions={{ onKeyDown }}
        subLabel="(Press ENTER to submit)"
        tooltip={t(`lamb_desc`, { ns: 'timeseries' })}
      />
    </div>
  );
};

export default withTranslation(['timeseries', 'constants'])(HPFilter);
