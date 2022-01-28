import { ChartConfiguration } from 'chart.js';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import * as chartUtils from '../../chartUtils';
import { CreateColumnCodeSnippet } from '../create/CodeSnippet';
import { LabeledCheckbox } from '../create/LabeledCheckbox';
import { LabeledInput } from '../create/LabeledInput';

import { buildCode as buildBaseCode, validate as validateBase } from './BaseInputs';
import { BaseComponentProps, BaseTimeseriesConfig, CFConfig } from './TimeseriesAnalysisState';

export const validate = (cfg: CFConfig & BaseTimeseriesConfig): string | undefined => {
  const error = validateBase(cfg);
  if (error) {
    return error;
  }
  const { low, high } = cfg;
  if (!low) {
    return 'Please enter a low!';
  }
  if (!high) {
    return 'Please enter a high!';
  }
  return undefined;
};

export const buildCode = (cfg: CFConfig & BaseTimeseriesConfig): CreateColumnCodeSnippet => {
  const { low, high, drift } = cfg;
  if (validateBase(cfg)) {
    return undefined;
  }
  return [
    'from statsmodels.tsa.filters.cf_filter import cffilter',
    '',
    buildBaseCode(cfg),
    `cycle = cffilter(s, ${low}, ${high}, ${drift ? 'True' : 'False'})`,
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

const CFFilter: React.FC<BaseComponentProps<CFConfig> & WithTranslation> = ({ cfg, updateState, t }) => {
  const [low, setLow] = React.useState(cfg?.low);
  const [high, setHigh] = React.useState(cfg?.high);
  const [drift, setDrift] = React.useState(cfg?.drift ?? true);

  React.useEffect(() => {
    updateState({ low, high, drift });
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && Number(e.currentTarget.value)) {
      updateState({ low, high, drift });
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
        <LabeledCheckbox
          label={t('Drift')}
          value={drift}
          setter={(value) => {
            setDrift(value);
            updateState({ low, high, drift: value });
          }}
          inputWidth={1}
        />
      </div>
    </React.Fragment>
  );
};

export default withTranslation(['timeseries', 'constants'])(CFFilter);
