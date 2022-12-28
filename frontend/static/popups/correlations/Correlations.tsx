import { ActiveElement, Chart, ChartConfiguration, ChartEvent, ScriptableContext } from 'chart.js';
import * as React from 'react';
import { useSelector } from 'react-redux';

import { Bouncer } from '../../Bouncer';
import { BouncerWrapper } from '../../BouncerWrapper';
import * as chartUtils from '../../chartUtils';
import * as actions from '../../redux/actions/dtale';
import { buildURL } from '../../redux/actions/url-utils';
import { AppState, CorrelationsPopupData } from '../../redux/state/AppState';
import { RemovableError } from '../../RemovableError';
import * as CorrelationsRepository from '../../repository/CorrelationsRepository';
import * as CustomFilterRepository from '../../repository/CustomFilterRepository';
import ChartsBody from '../charts/ChartsBody';

import CorrelationScatterStats from './CorrelationScatterStats';
import CorrelationsGrid from './CorrelationsGrid';
import CorrelationsTsOptions from './CorrelationsTsOptions';
import * as corrUtils from './correlationsUtils';
import PPSCollapsible from './PPSCollapsible';

/** State properties for Correlations */
export interface CorrelationsState {
  chart?: chartUtils.ChartObj;
  error?: JSX.Element;
  scatterError?: JSX.Element;
  correlations?: CorrelationsRepository.CorrelationGridRow[];
  selectedCols: string[];
  tsUrl?: string;
  selectedDate?: string;
  scatterUrl?: string;
  rolling: boolean;
  useRolling: boolean;
  window: number;
  minPeriods: number;
  loadingCorrelations: boolean;
  encodeStrings: boolean;
  strings: string[];
  dummyColMappings: Record<string, any>;
}

/** Correlations grid state properties */
export interface CorrelationsGridState {
  correlations: CorrelationsRepository.CorrelationGridRow[];
  columns: string[];
  dates: CorrelationsRepository.CorrelationDateOption[];
  strings: string[];
  dummyColMappings: Record<string, string[]>;
  hasDate: boolean;
  code: string;
}

/** Parameters for correlation timeseries URLs */
export interface CorrelationTimeseriesParameters {
  selectedCols: string[];
  selectedDate?: string;
  rolling: boolean;
  useRolling: boolean;
  window: number;
  minPeriods: number;
}

export const Correlations: React.FC = () => {
  const { dataId, chartData } = useSelector((state: AppState) => ({
    dataId: state.dataId,
    chartData: state.chartData as CorrelationsPopupData,
  }));
  const scatterBouncer = React.useRef<HTMLDivElement>(null);
  const scatterCanvas = React.useRef<HTMLCanvasElement>(null);
  const chartRef = React.useRef<chartUtils.ChartObj>();

  const [correlations, setCorrelations] = React.useState<CorrelationsGridState>();
  const [error, setError] = React.useState<JSX.Element>();
  const [scatterData, setScatterData] = React.useState<CorrelationsRepository.ScatterResponse>();
  const [scatterError, setScatterError] = React.useState<JSX.Element>();
  const [selectedCols, setSelectedCols] = React.useState<string[]>([]);
  const [tsUrl, setTsUrl] = React.useState<string>();
  const [tsCode, setTsCode] = React.useState<string>();
  const [tsPps, setTsPps] = React.useState<CorrelationsRepository.PPSInfo>();
  const [selectedDate, setSelectedDate] = React.useState<string>();
  const [scatterUrl, setScatterUrl] = React.useState<string>();
  const [rolling, setRolling] = React.useState<boolean>(false);
  const [useRolling, setUseRolling] = React.useState<boolean>(false);
  const [window, setWindow] = React.useState<number>(4);
  const [minPeriods, setMinPeriods] = React.useState<number>(1);
  const [loadingCorrelations, setLoadingCorrelations] = React.useState<boolean>(true);
  const [encodeStrings, setEncodeStrings] = React.useState<boolean>(false);

  const loadGrid = async (updatedEncodeStrings?: boolean): Promise<void> => {
    const response = await CorrelationsRepository.loadCorrelations(
      dataId,
      updatedEncodeStrings !== undefined ? updatedEncodeStrings : encodeStrings,
    );
    if (response?.error) {
      setError(<RemovableError {...response} />);
      setLoadingCorrelations(false);
      return;
    }
    if (response) {
      const { data, strings, code, dummyColMappings } = response;
      const dates = response.dates ?? [];
      const columns = data.map((row) => row.column);
      const updatedRolling = dates[0]?.rolling ?? false;
      const correlationsState = {
        correlations: data,
        columns,
        dates,
        strings: strings ?? [],
        dummyColMappings: dummyColMappings ?? {},
        hasDate: dates.length > 0,
        code,
      };
      setSelectedDate(dates[0]?.name);
      setRolling(updatedRolling);
      setLoadingCorrelations(false);
      setCorrelations(correlationsState);
    }
  };

  React.useEffect(() => {
    (async () => loadGrid())();
  }, []);

  const buildTs = (overrides?: Partial<CorrelationTimeseriesParameters>): void => {
    const path = `${CorrelationsRepository.BASE_CORRELATIONS_TS_URL}/${dataId}`;
    let urlParams: Record<string, any> = {
      selectedCols: overrides?.selectedCols ?? selectedCols,
      dummyCols: corrUtils.findDummyCols(selectedCols, correlations?.dummyColMappings ?? {}),
      dateCol: overrides?.selectedDate ?? selectedDate,
      rolling: (overrides?.rolling ?? rolling) || (overrides?.useRolling ?? useRolling),
    };
    if (urlParams.rolling) {
      urlParams = {
        ...urlParams,
        rollingWindow: overrides?.window ?? window,
        minPeriods: overrides?.minPeriods ?? minPeriods,
      };
    }
    setTsUrl(buildURL(path, urlParams, ['selectedCols', 'dateCol', 'rolling', 'rollingWindow', 'minPeriods']));
    setSelectedCols(urlParams.selectedCols);
    setSelectedDate(overrides?.selectedDate ?? selectedDate);
    setRolling(overrides?.rolling ?? rolling);
    setUseRolling(overrides?.useRolling ?? useRolling);
    setError(undefined);
    if (urlParams.rolling && overrides?.window !== undefined) {
      setWindow(overrides.window);
    }
    if (urlParams.rolling && overrides?.minPeriods !== undefined) {
      setMinPeriods(overrides.minPeriods);
    }
  };

  const viewScatterRow = (event: ChartEvent, elements: ActiveElement[], chart: Chart): void => {
    const point = chart.getElementsAtEventForMode(event as any as Event, 'nearest', { intersect: true }, false);
    if (point && point[0].datasetIndex !== undefined) {
      const data = chart.data.datasets[point[0].datasetIndex].data;
      if (data) {
        const index = (data[point[0].index] as corrUtils.CorrelationScatterPoint)?._corr_index;
        const updatedQuery: string[] = [];
        if (chartData.query) {
          updatedQuery.push(chartData.query);
        }
        updatedQuery.push(`index == ${index}`);
        CustomFilterRepository.save(dataId, updatedQuery.join(' and ')).then(() => {
          if (actions.isPopup()) {
            (global.window as any).opener.location.reload();
            return;
          }
          (global.window as any).location.reload();
        });
      }
    }
  };

  const buildScatter = (cols: string[], dateIndex?: number, updatedTsCode?: string): void => {
    const updatedScatterUrl = CorrelationsRepository.buildScatterUrl(
      dataId,
      cols,
      dateIndex,
      selectedDate,
      rolling,
      window,
      minPeriods,
      correlations?.dummyColMappings ?? {},
    );
    if (scatterUrl === updatedScatterUrl) {
      return;
    }
    setSelectedCols(cols);
    scatterBouncer.current?.style.setProperty('display', 'block');
    scatterCanvas.current?.style.setProperty('display', 'none');
    CorrelationsRepository.loadScatter(updatedScatterUrl).then((response) => {
      scatterBouncer.current?.style.setProperty('display', 'none');
      scatterCanvas.current?.style.setProperty('display', 'block');
      setScatterUrl(updatedScatterUrl);
      setTsCode(updatedTsCode);
      if (response?.error) {
        setScatterError(<RemovableError {...response} />);
        return;
      }
      if (response) {
        const builder = (ctx: HTMLCanvasElement): chartUtils.ChartObj | undefined => {
          if (!(response?.data?.all?.x ?? []).length) {
            return undefined;
          }
          const { x, y } = response ?? {};
          return corrUtils.createScatter(ctx, response, x, y, viewScatterRow);
        };
        chartRef.current = chartUtils.chartWrapper('rawScatterChart', chartRef.current, builder);
        setScatterData(response);
      }
      setScatterError(undefined);
    });
  };

  React.useEffect(() => {
    const { col1, col2 } = corrUtils.findCols(chartData, correlations?.columns ?? []);
    if (col1 && col2) {
      if (correlations?.hasDate) {
        if (rolling) {
          buildTs({ selectedCols: [col1, col2], rolling: true, useRolling: true });
        } else {
          buildTs({ selectedCols: [col1, col2], rolling: false });
        }
      } else {
        buildScatter([col1, col2]);
      }
    }
  }, [correlations]);

  const viewScatter = (event: ChartEvent, elements: ActiveElement[], chart: Chart): void => {
    const selectedPoints = chart.getElementsAtEventForMode(event as any as Event, 'index', { intersect: false }, false);
    const selectedPoint = selectedPoints[0];
    if (selectedPoint) {
      (chart.data.datasets[selectedPoint.datasetIndex] as any).selectedPoint = selectedPoint.index;
      buildScatter(selectedCols, selectedPoint.index);
    }
  };

  return (
    <div key="body" className="modal-body scatter-body">
      {error}
      <BouncerWrapper showBouncer={loadingCorrelations}>
        {correlations && (
          <React.Fragment>
            <CorrelationsGrid
              buildTs={(updatedSelectedCols: string[]): void => buildTs({ selectedCols: updatedSelectedCols })}
              {...{
                ...chartData,
                ...correlations,
                selectedDate,
                selectedCols,
                buildScatter,
                rolling,
                useRolling,
                window,
                minPeriods,
                encodeStrings,
              }}
              toggleStrings={async () => {
                setEncodeStrings(!encodeStrings);
                await loadGrid(!encodeStrings);
              }}
            />
            {!!selectedCols?.length && correlations.hasDate && (
              <React.Fragment>
                <PPSCollapsible ppsInfo={tsPps} />
                <CorrelationsTsOptions
                  {...{
                    ...correlations,
                    rolling,
                    useRolling,
                    selectedCols,
                    selectedDate,
                    window,
                    minPeriods,
                    buildTs,
                    tsCode,
                  }}
                />
                <ChartsBody
                  visible={true}
                  url={tsUrl}
                  columns={[
                    { name: 'x', dtype: 'datetime[ns]', index: 0 },
                    { name: 'corr', dtype: 'float64', index: 1 },
                  ]}
                  x={{ value: 'x' }}
                  y={[{ value: 'corr' }]}
                  configHandler={(config: Partial<ChartConfiguration>): Partial<ChartConfiguration> => {
                    config.options = { ...config.options };
                    config.options.scales = {
                      ...config.options?.scales,
                      ['y-corr']: {
                        min: -1.1,
                        max: 1.1,
                        ticks: { stepSize: 0.2 },
                        afterTickToLabelConversion: (data) => {
                          data.ticks[0] = { ...data.ticks[0], label: '' };
                          data.ticks[data.ticks.length - 1] = { ...data.ticks[data.ticks.length - 1], label: '' };
                        },
                      },
                    };
                    const lineConfig = config as Partial<ChartConfiguration<'line'>>;
                    if (lineConfig.options?.scales?.x) {
                      lineConfig.options.scales.x = { ...lineConfig.options.scales.x, title: { display: false } };
                    }
                    const lineGradient = chartUtils.getLineGradient(corrUtils.colorScale, 'y-corr', -1, 1);
                    config.options.onClick = viewScatter;
                    config.options.plugins = { ...config.options.plugins, legend: { display: false } };
                    config.plugins = [chartUtils.lineHoverPlugin(corrUtils.colorScale)];
                    if (config.data?.datasets?.[0]) {
                      (config.data.datasets[0] as any).selectedPoint = 0;
                      const buildColor = (context: ScriptableContext<'line'>): CanvasGradient | undefined => {
                        const { chart } = context;
                        const { data } = context.dataset;

                        if (!chart.chartArea) {
                          // This case happens on initial chart load
                          return;
                        }
                        return lineGradient(context.chart, data as number[]);
                      };
                      const dataset = config.data.datasets[0];
                      dataset.borderColor = buildColor;
                      dataset.backgroundColor = buildColor;
                      dataset.hoverBackgroundColor = buildColor;
                      dataset.hoverBorderColor = buildColor;
                      (dataset as any).pointHoverBackgroundColor = buildColor;
                      (dataset as any).pointBorderColor = buildColor;
                      (dataset as any).pointBackgroundColor = buildColor;
                      (dataset as any).pointHoverBackgroundColor = buildColor;
                      (dataset as any).pointHoverBorderColor = buildColor;
                    }
                    return config;
                  }}
                  height={300}
                  showControls={false}
                  dataLoadCallback={(data: chartUtils.DataSpec): void => {
                    const tsData = data as CorrelationsRepository.TimeseriesResponse;
                    setTsPps(tsData.pps);
                    if (tsData?.data?.all?.x?.[0] && selectedCols.length > 1) {
                      buildScatter(selectedCols, 0, tsData.code);
                    } else {
                      setTsCode(tsData.code);
                    }
                  }}
                />
              </React.Fragment>
            )}
            {scatterData !== undefined && <CorrelationScatterStats {...{ selectedCols, ...scatterData }} />}
            <figure>
              {scatterError}
              {!scatterError && (
                <div className="chart-wrapper" style={{ height: 400 }}>
                  <div id="scatter-bouncer" style={{ display: 'none' }} ref={scatterBouncer}>
                    <Bouncer />
                  </div>
                  <canvas id="rawScatterChart" ref={scatterCanvas} />
                </div>
              )}
            </figure>
          </React.Fragment>
        )}
      </BouncerWrapper>
    </div>
  );
};
