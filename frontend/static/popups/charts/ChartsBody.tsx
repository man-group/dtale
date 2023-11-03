import { ActiveElement, Chart, ChartConfiguration, ChartOptions } from 'chart.js';
import moment from 'moment';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { createFilter, default as Select } from 'react-select';

import { Bouncer } from '../../Bouncer';
import * as chartUtils from '../../chartUtils';
import { usePrevious } from '../../customHooks';
import { ColumnDef } from '../../dtale/DataViewerState';
import * as gu from '../../dtale/gridUtils';
import { JSAnchor } from '../../JSAnchor';
import { BaseOption } from '../../redux/state/AppState';
import { RemovableError } from '../../RemovableError';
import * as ChartsRepository from '../../repository/ChartsRepository';
import { toggleBouncer } from '../../toggleUtils';

import AxisEditor from './AxisEditor';
import ChartLabel from './ChartLabel';
import { ChartsState } from './Charts';
import WordcloudBody from './WordcloudBody';

/** Component properties for ChartsBody */
export interface ChartsBodyProps extends ChartsState {
  url?: string;
  columns: ColumnDef[];
  chartType?: string;
  chartPerGroup?: boolean;
  chartPerY?: boolean;
  visible: boolean;
  height?: number;
  additionalOptions?: Partial<ChartOptions>;
  configHandler?: (cfg: Partial<ChartConfiguration>) => Partial<ChartConfiguration>;
  showControls?: boolean;
  dataLoadCallback?: (data: chartUtils.DataSpec) => void;
}

const ChartsBody: React.FC<ChartsBodyProps & WithTranslation> = ({ t, ...props }) => {
  const [chartType, setChartType] = React.useState<BaseOption<string>>({ value: props.chartType ?? 'line' });
  const prevChartType = usePrevious(chartType);
  const [chartPerGroup, setChartPerGroup] = React.useState<boolean>(
    ['true', true].includes(props.chartPerGroup ?? false),
  );
  const [chartPerY, setChartPerY] = React.useState<boolean>(['true', true].includes(props.chartPerY ?? false));
  const [chartSort, setChartSort] = React.useState<BaseOption<string> | undefined>(
    props.x ? { ...props.x } : undefined,
  );
  const [data, setData] = React.useState<chartUtils.DataSpec>();
  const [error, setError] = React.useState<JSX.Element>();
  const [zoomed, setZoomed] = React.useState<string>();

  const charts = React.useRef<Array<chartUtils.ChartObj | undefined>>();

  const chartTypes = React.useMemo((): string[] => {
    const types = ['line', 'bar', 'stacked'];
    const yList = props.y ?? [];
    if (yList.length < 2) {
      types.push('scatter');
      types.push('pie');
    }
    types.push('wordcloud');
    return types;
  }, [props.y]);

  const viewTimeDetails = (evt: MouseEvent, elements: ActiveElement[], chart: Chart): void => {
    const selectedPoint = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, false)[0];
    if (selectedPoint) {
      const ticks = {
        min: chart.data.labels![Math.max(0, selectedPoint.index - 10)] as number,
        max: chart.data.labels![Math.min(chart.data.labels!.length - 1, selectedPoint.index + 10)] as number,
      };
      charts.current?.forEach((c) => {
        if (c?.options?.scales?.x) {
          c.options.scales.x = { ...c.options.scales.x, ...ticks };
          c.update();
        }
      });
      let zoomedText = `${ticks.min} - ${ticks.max}`;
      if (gu.isDateCol(props.columns.find((c) => c.name === props.x?.value)?.dtype)) {
        const buildLabel = (x: number): string => moment(new Date(x)).format('YYYY-MM-DD');
        zoomedText = `${buildLabel(ticks?.min ?? 0)} - ${buildLabel(ticks?.max ?? 0)}`;
      }
      setZoomed(zoomedText);
    }
  };

  const createChartCfg = (
    ctx: HTMLCanvasElement,
    chartData: chartUtils.DataSpec,
    mainProps: chartUtils.PropSpec,
    funcs: any = {},
  ): chartUtils.ChartObj => {
    let cfg: ChartConfiguration;
    switch (chartType.value) {
      case 'bar':
        cfg = chartUtils.createBarCfg(chartData, mainProps) as ChartConfiguration;
        break;
      case 'stacked':
        cfg = chartUtils.createStackedCfg(chartData, mainProps) as ChartConfiguration;
        break;
      case 'scatter':
        cfg = chartUtils.createScatterCfg(chartData, mainProps) as ChartConfiguration;
        break;
      case 'pie':
        cfg = chartUtils.createPieCfg(chartData, mainProps) as ChartConfiguration;
        break;
      case 'line':
      default: {
        if (funcs.viewTimeDetails) {
          mainProps.additionalOptions = { ...props.additionalOptions, onClick: funcs.viewTimeDetails };
        }
        cfg = chartUtils.createLineCfg(chartData, mainProps) as ChartConfiguration;
        break;
      }
    }
    return chartUtils.createChart(ctx, cfg);
  };

  const createCharts = (
    updatedData?: chartUtils.DataSpec,
    funcs: any = {},
  ): Array<chartUtils.ChartObj | undefined> | undefined => {
    if (!Object.keys(updatedData?.data ?? {}).length) {
      return undefined;
    }
    if (chartType?.value === 'wordcloud') {
      return undefined;
    }
    const mainProps: chartUtils.PropSpec = {
      columns: props.columns,
      x: props.x?.value!,
      y: (props.y ?? []).map(({ value }) => value),
      additionalOptions: { ...props.additionalOptions },
      configHandler: props.configHandler,
    };
    if (chartPerY) {
      return props.y?.map((series, seriesIndex) => {
        const seriesKey = series.value;
        const subData = {
          data: { all: { [seriesKey]: updatedData?.data?.all[seriesKey] ?? [], x: updatedData?.data?.all.x ?? [] } },
          min: updatedData?.min ?? {},
          max: updatedData?.max ?? {},
        };
        const builder = (ctx: HTMLCanvasElement): chartUtils.ChartObj | undefined =>
          createChartCfg(
            ctx,
            subData,
            {
              ...mainProps,
              additionalOptions: {
                ...mainProps.additionalOptions,
                plugins: { ...mainProps.additionalOptions?.plugins, title: { display: true, text: seriesKey } },
              },
            },
            funcs,
          );
        return chartUtils.chartWrapper(`chartCanvas-${seriesKey}`, charts.current?.[seriesIndex], builder);
      });
    }
    if (chartPerGroup) {
      return Object.keys(updatedData?.data ?? {}).map((seriesKey, seriesIndex) => {
        const series = updatedData?.data?.[seriesKey];
        const subData = { data: { all: series ?? {} }, min: updatedData?.min ?? {}, max: updatedData?.max ?? {} };
        const builder = (ctx: HTMLCanvasElement): chartUtils.ChartObj | undefined =>
          createChartCfg(
            ctx,
            subData,
            {
              ...mainProps,
              additionalOptions: {
                ...mainProps.additionalOptions,
                plugins: { ...mainProps.additionalOptions?.plugins, title: { display: true, text: seriesKey } },
              },
            },
            funcs,
          );
        return chartUtils.chartWrapper(`chartCanvas-${seriesKey}`, charts.current?.[seriesIndex], builder);
      });
    }
    const builder = (ctx: HTMLCanvasElement): chartUtils.ChartObj | undefined =>
      createChartCfg(ctx, updatedData!, mainProps, funcs);
    return [chartUtils.chartWrapper('chartCanvas', charts.current?.[0], builder)];
  };

  const loadChartData = (): void => {
    if (!props.url) {
      return;
    }
    toggleBouncer(['chart-bouncer', 'coveragePopup']);
    (charts.current ?? []).forEach((c) => c?.destroy());
    ChartsRepository.load(props.url, chartType).then((response) => {
      toggleBouncer(['chart-bouncer', 'coveragePopup']);
      setChartSort(props.x ? { ...props.x } : undefined);
      if (response?.error) {
        setError(<RemovableError {...response} />);
        charts.current = undefined;
        setData(undefined);
        return;
      }
      if (!Object.keys(response?.data ?? {}).length) {
        setError(<RemovableError error="No data found." />);
        setData(undefined);
        charts.current = undefined;
        return;
      }
      setError(undefined);
      setData(response);
      charts.current = createCharts(response, { viewTimeDetails });
      props.dataLoadCallback?.(response!);
    });
  };

  const sortBars = (updatedChartSort?: BaseOption<string>): void => {
    charts.current?.forEach((c) => c?.destroy());
    setError(undefined);

    const sortedData: chartUtils.DataSpec = { min: {}, max: {}, ...data };
    Object.values(sortedData?.data ?? {}).forEach((series) => {
      const xProp = props.x?.value;
      const propNames = [...(props.y ?? [])].concat(props.x ?? []).map(({ value }) => value);
      const sortIdx = updatedChartSort ? propNames.findIndex((propName) => propName === updatedChartSort.value) : -1;

      const seriesArrays = propNames.map((p) => series[p === xProp ? 'x' : p]);
      const zippedArrays = seriesArrays[0]
        .map((s0, s0idx) => seriesArrays.map((arr) => arr[s0idx]))
        .sort((a, b) => {
          if (a[sortIdx] < b[sortIdx]) {
            return -1;
          }
          if (a[sortIdx] > b[sortIdx]) {
            return 1;
          }
          return 0;
        });
      const sortedArrays = new Array(propNames.length).fill([]);
      zippedArrays.forEach((zippedArray) => zippedArray.forEach((val, idx) => sortedArrays[idx].push(val)));
      propNames.forEach((propName, propNameIdx) => {
        const arr = sortedArrays[propNameIdx];
        const currKey = propName === xProp ? 'x' : propName;
        series[currKey] = arr;
      });
    });
    charts.current = createCharts(sortedData, { viewTimeDetails });
    setChartSort(updatedChartSort);
  };

  React.useEffect(() => {
    if (props.visible && props.url) {
      loadChartData();
    }
  }, [props.url]);

  React.useEffect(() => {
    if (props.visible) {
      setChartPerGroup(['true', true].includes(props.chartPerGroup ?? false));
    }
  }, [props.chartPerGroup]);

  React.useEffect(() => {
    if (props.visible) {
      setChartPerY(['true', true].includes(props.chartPerY ?? false));
    }
  }, [props.chartPerY]);

  React.useEffect(() => {
    if (prevChartType?.value === 'scatter') {
      loadChartData(); // need to reload chart data because scatter charts allow duplicates
    } else if (chartSort?.value === props.x?.value) {
      if (Object.keys(data ?? {}).length) {
        charts.current?.forEach((c) => c?.destroy());
        setError(undefined);
        charts.current = createCharts(data, { viewTimeDetails });
      }
    } else {
      sortBars(props.x);
    }
  }, [chartType, chartPerGroup, chartPerY]);

  const resetZoom = (): void => {
    if (charts.current) {
      charts.current.forEach((c) => {
        if (c?.options?.scales?.x?.ticks) {
          delete c.options.scales.x.ticks;
          c.update();
        }
      });
      setZoomed(undefined);
    }
  };

  const renderLabel = (): React.ReactNode => {
    return (
      !!Object.keys(data?.data ?? {}).length &&
      error === undefined && (
        <React.Fragment>
          <ChartLabel {...props} />
          {zoomed && (
            <div className="coverage-desc">
              <span className="pr-3" style={{ marginLeft: '3em' }}>{`${t('Zoomed')}: ${zoomed}`}</span>
              <JSAnchor onClick={resetZoom}>{t('X')}</JSAnchor>
            </div>
          )}
        </React.Fragment>
      )
    );
  };

  const updateAxis = (settings: chartUtils.AxisSpec): void => {
    if (JSON.stringify(settings) === JSON.stringify({ min: data?.min, max: data?.max })) {
      return;
    }
    charts.current?.forEach((c) => c?.destroy());
    const updatedData: chartUtils.DataSpec = { ...data, ...settings };
    setData(updatedData);
    charts.current = createCharts(updatedData, { viewTimeDetails });
  };

  const renderControls = (): React.ReactNode => {
    if (props.showControls ?? true) {
      const showBarSort = chartType?.value === 'bar' && Object.keys(data?.data ?? {}).length;
      return (
        <React.Fragment>
          <div className="row pt-3 pb-3 charts-filters">
            <div className="col-auto">
              <div className="input-group mr-3">
                <span className="input-group-addon">{t('Chart')}</span>
                <Select
                  className="Select is-clearable is-searchable Select--single"
                  classNamePrefix="Select"
                  options={chartTypes.map((ct) => ({ value: ct }))}
                  getOptionLabel={(option) => option.value}
                  getOptionValue={(option) => option.value}
                  value={chartType}
                  onChange={(selected) => setChartType(selected!)}
                  filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
                />
              </div>
            </div>
            {!!props.group?.length && (
              <div className="col-auto">
                <div className="input-group mr-3">
                  <span className="input-group-addon">{t('Chart per Group')}</span>
                  <Select
                    className="Select is-clearable is-searchable Select--single"
                    classNamePrefix="Select"
                    options={[{ value: 'On' }, { value: 'Off' }]}
                    getOptionLabel={(option) => option.value}
                    getOptionValue={(option) => option.value}
                    value={chartPerGroup ? { value: 'On' } : { value: 'Off' }}
                    onChange={(selected) => setChartPerGroup(selected?.value === 'On')}
                    filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
                  />
                </div>
              </div>
            )}
            {showBarSort && (
              <div className="col-auto">
                <div className="input-group mr-3">
                  <span className="input-group-addon">{t('Sort')}</span>
                  <Select
                    className="Select is-clearable is-searchable Select--single"
                    classNamePrefix="Select"
                    options={(props.y ?? []).concat(props.x ?? [])}
                    getOptionLabel={(option) => option.value}
                    getOptionValue={(option) => option.value}
                    value={chartSort}
                    onChange={(selected) => sortBars(selected ?? undefined)}
                    filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
                  />
                </div>
              </div>
            )}
            {data !== undefined && <AxisEditor y={props.y} data={data} updateAxis={updateAxis} />}
          </div>
          <div className="row pb-3">
            <div className="col-md-10">{renderLabel()}</div>
          </div>
        </React.Fragment>
      );
    }
    return null;
  };

  const renderChartMarkup = (): JSX.Element => {
    if (chartType?.value === 'wordcloud') {
      return (
        <WordcloudBody data={data} y={props.y} group={props.group} chartType={chartType} height={props.height ?? 400} />
      );
    } else if (chartPerGroup) {
      return (
        <div className="row">
          {Object.keys(data?.data ?? {}).map((k) => (
            <div key={k} className="col-md-6" style={{ height: props.height ?? 400 }}>
              <canvas id={`chartCanvas-${k}`} height={props.height ?? 400} />
            </div>
          ))}
        </div>
      );
    } else if (chartPerY) {
      return (
        <div className="row">
          {props.y?.map(({ value }) => {
            if (value === 'x') {
              return null;
            }
            return (
              <div key={value} className="col-md-12" style={{ height: props.height ?? 400 }}>
                <canvas id={`chartCanvas-${value}`} height={props.height ?? 400} />
              </div>
            );
          })}
        </div>
      );
    } else {
      return <canvas id="chartCanvas" height={props.height ?? 400} />;
    }
  };

  if (!props.visible) {
    return null;
  }

  return (
    <React.Fragment>
      {renderControls()}
      <div data-testid="charts-body">
        <div id="chart-bouncer" style={{ display: 'none' }}>
          <Bouncer />
        </div>
        {error}
        {renderChartMarkup()}
      </div>
    </React.Fragment>
  );
};

export default withTranslation('charts', { withRef: true })(ChartsBody);
