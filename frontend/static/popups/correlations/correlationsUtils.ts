import { ActiveElement, Chart, ChartEvent, ScatterDataPoint, TooltipItem } from 'chart.js';
import chroma from 'chroma-js';

import * as chartUtils from '../../chartUtils';
import { BaseCorrelationsPopupData } from '../../redux/state/AppState';

import { CorrelationsState } from './Correlations';

export const buildState = (): CorrelationsState => ({
  selectedCols: [],
  rolling: false,
  useRolling: false,
  window: 4,
  minPeriods: 1,
  loadingCorrelations: true,
  encodeStrings: false,
  strings: [],
  dummyColMappings: {},
});

export const findDummyCols = (cols: string[], dummyColMappings: Record<string, string[]>): string[] => {
  const dummyCols: string[] = [];
  cols.forEach((col) => {
    const possibleKeys = Object.keys(dummyColMappings).filter((dummyCol) => col.startsWith(dummyCol));
    possibleKeys.forEach((key) => {
      if (dummyColMappings[key].includes(col) && !dummyCols.includes(key)) {
        dummyCols.push(key);
        return;
      }
    });
  });
  return dummyCols;
};

export const colorScale = chroma.scale(['red', 'yellow', 'green']).domain([-1, 0, 1]);
export const ppsScale = chroma
  .scale(['#f7fbff', '#d0e1f2', '#94c4df', '#4b98c9', '#1664ab', '#08306b'])
  .domain([0, 0.2, 0.4, 0.6, 0.8, 1.0]);
export const percent = (num: string | number): string =>
  num === 'N/A' ? num : `${((num as number) * 100).toFixed(2)}%`;

/** Properties for points within the Correlations scatter chart */
export type CorrelationScatterPoint = ScatterDataPoint & { [key: string]: any };

export const createScatter = (
  ctx: HTMLCanvasElement,
  data: chartUtils.DataSpec,
  xProp: string,
  yProp: string,
  onClick: (event: ChartEvent, elements: ActiveElement[], chart: Chart) => void,
): chartUtils.ChartObj => {
  const additionalProps = Object.keys(data?.data?.all ?? {}).filter((prop) => !['x', yProp].includes(prop));
  const builder = (builderData: Record<string, Record<string, Array<string | number>>>): CorrelationScatterPoint[] =>
    Array.from({ length: (builderData?.all?.x ?? []).length }, (value: number, idx: number) =>
      additionalProps.reduce(
        (res, prop) => ({
          ...res,
          [prop === yProp ? 'y' : prop]: builderData?.all?.[prop]?.[idx],
        }),
        { x: builderData?.all?.x?.[idx], y: builderData?.all?.[yProp]?.[idx] } as any,
      ),
    );
  const scatterCfg = chartUtils.createScatterCfg(data, { x: xProp, y: [yProp] }, builder);
  if (scatterCfg.options?.plugins?.tooltip?.callbacks) {
    scatterCfg.options.plugins.tooltip.callbacks.title = (tooltipItems: Array<TooltipItem<'scatter'>>): string[] =>
      additionalProps.map((p) => `${p}: ${(tooltipItems[0].raw as CorrelationScatterPoint)[p] ?? ''}`);
  }
  scatterCfg.options = { ...scatterCfg.options, onClick, maintainAspectRatio: false };
  delete scatterCfg.options.scales?.x?.ticks;
  chartUtils.updateLegend(scatterCfg, true);
  return chartUtils.createChart(ctx, scatterCfg);
};

/** Selected column for a correlation timeseries or scatter */
export interface SelectedColsDef {
  col1?: string;
  col2?: string;
}

export const findCols = (chartData: BaseCorrelationsPopupData, columns: string[]): SelectedColsDef => {
  let { col1, col2 } = chartData || {};
  if (col1 === undefined) {
    if (col2 === undefined) {
      [col1, col2] = columns.slice(0, 2);
    } else {
      col1 = columns.find((c) => c !== col2);
    }
  } else if (col2 === undefined) {
    col2 = columns.find((c) => c !== col1);
  }
  return { col1, col2 };
};
