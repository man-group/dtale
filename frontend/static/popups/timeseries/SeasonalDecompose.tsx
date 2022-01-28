import { ChartConfiguration } from 'chart.js';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import ButtonToggle from '../../ButtonToggle';
import * as chartUtils from '../../chartUtils';
import { CreateColumnCodeSnippet } from '../create/CodeSnippet';

import { buildCode as buildBaseCode, validate as validateBase } from './BaseInputs';
import {
  BaseComponentProps,
  BaseTimeseriesConfig,
  SeasonalDecomposeConfig,
  SeasonalDecomposeModel,
  TimeseriesAnalysisType,
} from './TimeseriesAnalysisState';

export const validate = (cfg: BaseTimeseriesConfig): string | undefined => {
  return validateBase(cfg);
};

export const buildCode = (
  cfg: SeasonalDecomposeConfig & BaseTimeseriesConfig & { type: TimeseriesAnalysisType },
): CreateColumnCodeSnippet => {
  if (validateBase(cfg)) {
    return undefined;
  }
  const code = [];
  if (cfg.type === TimeseriesAnalysisType.SEASONAL_DECOMPOSE) {
    code.push('from statsmodels.tsa.seasonal import seasonal_decompose');
  } else {
    code.push('from statsmodels.tsa.seasonal import STL');
  }
  code.push('');
  code.push(buildBaseCode(cfg));
  if (cfg.type === TimeseriesAnalysisType.SEASONAL_DECOMPOSE) {
    code.push(`sd_result = seasonal_decompose(s, model='${cfg.model}')`);
  } else {
    code.push('stl_result = STL(s).fit()');
  }
  return code;
};

export const CHART_COLS = ['trend', 'seasonal', 'resid'];

export const chartConfigBuilder = (
  config: BaseTimeseriesConfig,
  chartConfig: Partial<ChartConfiguration<'line'>>,
): Partial<ChartConfiguration<'line'>> => {
  const { col } = config;
  chartConfig.data = {
    ...chartConfig.data,
    datasets: (chartConfig.data?.datasets ?? []).slice(0, 4).map((dataset, i) => {
      chartUtils.updateColorProps(dataset, chartUtils.TS_COLORS[i]);
      if (i === 1) {
        return { ...dataset, yAxisID: `y-${col}` };
      }
      if (i === 3) {
        return { ...dataset, yAxisID: 'y-seasonal' };
      }
      return { ...dataset };
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
      ['y-seasonal']: {
        ...chartConfig.options?.scales?.['y-seasonal'],
        position: 'right',
        title: { text: `seasonal, resid` },
      },
      ['y-trend']: { ...chartConfig.options?.scales?.['y-trend'], display: false },
      ['y-resid']: { ...chartConfig.options?.scales?.['y-resid'], display: false },
      x: { ...chartConfig.options?.scales?.x, title: { display: false } },
    },
  };
  chartConfig.options = {
    ...chartConfig.options,
    plugins: { ...chartConfig.options?.plugins, legend: { display: true } },
  };
  return chartConfig;
};

/** Component properties for SeasonalDecompose */
export interface SeasonalDecomposeProps extends BaseComponentProps<SeasonalDecomposeConfig> {
  type: TimeseriesAnalysisType;
}

const SeasonalDecompose: React.FC<SeasonalDecomposeProps & WithTranslation> = ({ type, cfg, updateState, t }) => {
  const models = React.useMemo(
    () =>
      Object.values(SeasonalDecomposeModel).map((value) => ({
        value,
        label: <span className="d-block">{t(`timeseries:${value}`)}</span>,
      })),
    [t],
  );
  const [model, setModel] = React.useState(cfg.model);

  React.useEffect(() => {
    updateState({ model });
  }, []);

  return (
    <React.Fragment>
      {type === TimeseriesAnalysisType.SEASONAL_DECOMPOSE && (
        <div className="col-md-4">
          <div className="form-group row">
            <label className="col-md-3 col-form-label text-right">{t('timeseries:Model')}</label>
            <div className="col-md-8">
              <ButtonToggle
                options={models}
                update={(value) => {
                  setModel(value);
                  updateState({ model: value });
                }}
                defaultValue={model}
                className="pl-0"
              />
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default withTranslation(['timeseries', 'constants'])(SeasonalDecompose);
