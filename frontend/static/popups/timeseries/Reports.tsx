import { ChartConfiguration } from 'chart.js';
import React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { BouncerWrapper } from '../../BouncerWrapper';
import ButtonToggle from '../../ButtonToggle';
import * as chartUtils from '../../chartUtils';
import { ColumnDef } from '../../dtale/DataViewerState';
import { isDateCol } from '../../dtale/gridUtils';
import { ActionType, HideSidePanelAction } from '../../redux/actions/AppActions';
import { buildURLString } from '../../redux/actions/url-utils';
import { AppState, ButtonOption } from '../../redux/state/AppState';
import { RemovableError } from '../../RemovableError';
import * as DtypesRepository from '../../repository/DtypesRepository';
import ChartsBody from '../charts/ChartsBody';
import { CreateColumnCodeSnippet } from '../create/CodeSnippet';
import { Checkbox } from '../create/LabeledCheckbox';

import BaseInputs from './BaseInputs';
import BKFilter, * as BKFilterUtils from './BKFilter';
import CFFilter, * as CFFilterUtils from './CFFilter';
import HPFilter, * as HPFilterUtils from './HPFilter';
import SeasonalDecompose, * as SeasonalDecomposeUtils from './SeasonalDecompose';
import {
  BASE_CFGS,
  BaseTimeseriesConfig,
  BKConfig,
  CFConfig,
  ConfigsHolder,
  HPConfig,
  SeasonalDecomposeConfig,
  TimeseriesAnalysisType,
} from './TimeseriesAnalysisState';

require('./Reports.css');

const Reports: React.FC<WithTranslation> = ({ t }) => {
  const { dataId, pythonVersion } = useSelector((state: AppState) => ({
    dataId: state.dataId,
    pythonVersion: state.pythonVersion,
  }));
  const dispatch = useDispatch();
  const hideSidePanel = (): HideSidePanelAction => dispatch({ type: ActionType.HIDE_SIDE_PANEL });
  const typeOpts = React.useMemo(() => {
    const options: Array<ButtonOption<TimeseriesAnalysisType>> = [];
    Object.values(TimeseriesAnalysisType).forEach((value) => {
      if (value === TimeseriesAnalysisType.STL && pythonVersion && pythonVersion[0] < 3) {
        return;
      }
      options.push({ value, label: <span className="d-block">{t(`timeseries:${value}`)}</span> });
    });
    return options;
  }, [t, pythonVersion]);
  const [type, setType] = React.useState(TimeseriesAnalysisType.HPFILTER);
  const [baseCfg, setBaseCfg] = React.useState<BaseTimeseriesConfig>({});
  const [cfg, setCfg] = React.useState<ConfigsHolder>({ ...BASE_CFGS });
  const [code, setCode] = React.useState<Record<TimeseriesAnalysisType, CreateColumnCodeSnippet>>(
    {} as Record<TimeseriesAnalysisType, string>,
  );
  const [loadingColumns, setLoadingColumns] = React.useState(true);
  const [error, setError] = React.useState<JSX.Element>();
  const [columns, setColumns] = React.useState<ColumnDef[]>([]);
  const [url, setUrl] = React.useState<string>();
  const [multiChart, setMultiChart] = React.useState(false);

  React.useEffect(() => {
    DtypesRepository.loadDtypes(dataId).then((response) => {
      setLoadingColumns(false);
      if (response?.error) {
        setError(<RemovableError {...response} />);
        return;
      }
      if (response) {
        setColumns(response.dtypes);
        const dateCols = (response.dtypes ?? []).filter((c) => isDateCol(c.dtype));
        if (dateCols.length === 1) {
          setBaseCfg({ ...baseCfg, index: dateCols[0].name });
        }
      }
    });
  }, []);

  const run = (): void => {
    if (!columns.length) {
      return;
    }
    let cfgError;
    let cfgCode;
    switch (type) {
      case TimeseriesAnalysisType.SEASONAL_DECOMPOSE:
      case TimeseriesAnalysisType.STL:
        cfgError = SeasonalDecomposeUtils.validate({ ...baseCfg, ...cfg[type] });
        cfgCode = SeasonalDecomposeUtils.buildCode({ ...baseCfg, type, ...cfg[type] });
        break;
      case TimeseriesAnalysisType.BKFILTER:
        cfgError = BKFilterUtils.validate({ ...baseCfg, ...cfg[type] });
        cfgCode = BKFilterUtils.buildCode({ ...baseCfg, ...cfg[type] });
        break;
      case TimeseriesAnalysisType.CFFILTER:
        cfgError = CFFilterUtils.validate({ ...baseCfg, ...cfg[type] });
        cfgCode = CFFilterUtils.buildCode({ ...baseCfg, ...cfg[type] });
        break;
      case TimeseriesAnalysisType.HPFILTER:
      default:
        cfgError = HPFilterUtils.validate({ ...baseCfg, ...cfg[type] });
        cfgCode = HPFilterUtils.buildCode({ ...baseCfg, ...cfg[type] });
        break;
    }
    if (cfgError) {
      setUrl(undefined);
      setError(<RemovableError error={cfgError} />);
      return;
    }
    const createParams = { type, cfg: JSON.stringify({ ...baseCfg, ...cfg[type] }) };
    setUrl(buildURLString(`/dtale/timeseries-analysis/${dataId}?`, createParams));
    setCode({ ...code, [type]: cfgCode });
    setError(undefined);
  };

  React.useEffect(() => run(), [baseCfg, cfg, type]);

  const renderBody = (): JSX.Element => {
    const updateState = <T,>(updates: T): void => setCfg({ ...cfg, [type]: { ...updates } });
    let body: React.ReactNode = null;
    let configHandler: (
      config: BaseTimeseriesConfig,
      chartConfig: Partial<ChartConfiguration<'line'>>,
    ) => Partial<ChartConfiguration<'line'>>;
    let chartCols: string[] = [];
    switch (type) {
      case TimeseriesAnalysisType.SEASONAL_DECOMPOSE:
      case TimeseriesAnalysisType.STL:
        body = (
          <SeasonalDecompose
            cfg={cfg[type]}
            type={type}
            updateState={(updates: SeasonalDecomposeConfig) => updateState(updates)}
          />
        );
        configHandler = SeasonalDecomposeUtils.chartConfigBuilder;
        chartCols = SeasonalDecomposeUtils.CHART_COLS;
        break;
      case TimeseriesAnalysisType.BKFILTER:
        body = <BKFilter cfg={cfg[type]} updateState={(updates: BKConfig) => updateState(updates)} />;
        configHandler = BKFilterUtils.chartConfigBuilder;
        chartCols = BKFilterUtils.CHART_COLS;
        break;
      case TimeseriesAnalysisType.CFFILTER:
        body = <CFFilter cfg={cfg[type]} updateState={(updates: CFConfig) => updateState(updates)} />;
        configHandler = CFFilterUtils.chartConfigBuilder;
        chartCols = CFFilterUtils.CHART_COLS;
        break;
      case TimeseriesAnalysisType.HPFILTER:
      default:
        body = <HPFilter cfg={cfg[type]} updateState={(updates: HPConfig) => updateState(updates)} />;
        configHandler = HPFilterUtils.chartConfigBuilder;
        chartCols = HPFilterUtils.CHART_COLS;
        break;
    }
    return (
      <React.Fragment>
        <div className="row ml-0 mr-0">
          <div className="col-auto pl-0">
            <h2>{t('Time Series Analysis', { ns: 'menu' })}</h2>
          </div>
          <div className="col" />
          <div className="col-auto">
            <button className="btn btn-plain" onClick={hideSidePanel}>
              <i className="ico-close pointer" title={t('side:Close') ?? undefined} />
            </button>
          </div>
        </div>
        <div className="row ml-0 mr-0">
          <ButtonToggle options={typeOpts} update={setType} defaultValue={type} className="pl-0" />
          <div className="col">
            <div className="form-group row mb-0">
              <label className="col-auto col-form-label text-right pr-0">{t('Split Charts')}</label>
              <div className="col-auto mt-auto mb-auto pl-4">
                <Checkbox value={multiChart} setter={setMultiChart} />
              </div>
            </div>
          </div>
        </div>
        <div className="row ml-0 mr-0 pt-5 hpfilter-inputs">
          <BaseInputs
            columns={columns}
            updateState={(updates: BaseTimeseriesConfig) => setBaseCfg({ ...cfg, ...updates })}
            cfg={baseCfg}
          />
          {body}
        </div>
        {url && (
          <>
            <h3 className="mt-3 text-center">{t(`timeseries:${type}`)}</h3>
            <div className="pl-5 pr-5">
              <ChartsBody
                visible={url !== undefined}
                url={url}
                columns={[
                  ...columns.filter((col) => baseCfg.index === col.name || baseCfg.col === col.name),
                  ...chartCols.map((col, i) => ({ name: col, dtype: 'float64', index: i })),
                ]}
                x={{ value: baseCfg.index! }}
                y={[{ value: baseCfg.col! }, ...chartCols.map((col) => ({ value: col }))]}
                configHandler={(config) => {
                  const lineConfig = config as ChartConfiguration<'line'>;
                  if (multiChart) {
                    const dataset = lineConfig.data?.datasets?.find((d) => d.data)!;
                    lineConfig.data = {
                      ...lineConfig.data,
                      datasets: [dataset],
                    };
                    const field = dataset.label;
                    chartUtils.updateColorProps(dataset, chartUtils.TS_COLORS[0]);
                    const scales = Object.entries(lineConfig.options?.scales ?? {}).reduce((res, [key, scale]) => {
                      if (key === 'x') {
                        return { ...res, [key]: { ...scale, title: { display: false } } };
                      }
                      if (key === `y-${field}`) {
                        return { ...res, [key]: { ...scale, position: 'left' } };
                      }
                      return res;
                    }, {});
                    lineConfig.options = { ...lineConfig.options, scales };
                    lineConfig.options = {
                      ...lineConfig.options,
                      plugins: { ...lineConfig.options?.plugins, legend: { display: true } },
                    };
                    return lineConfig;
                  }
                  return configHandler?.(baseCfg, lineConfig);
                }}
                height={300}
                showControls={false}
                chartPerY={multiChart}
              />
            </div>
            <h4 className="mt-3">Code</h4>
            <pre>{(code[type] as string[])?.join('\n')}</pre>
          </>
        )}
      </React.Fragment>
    );
  };

  return (
    <React.Fragment>
      {error && (
        <div key="error" className="row" style={{ margin: '0 2em' }}>
          <div className="col-md-12">{error}</div>
        </div>
      )}
      <BouncerWrapper showBouncer={loadingColumns}>{renderBody()}</BouncerWrapper>
    </React.Fragment>
  );
};

export default withTranslation(['timeseries', 'menu', 'side'])(Reports);
