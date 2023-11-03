import * as React from 'react';

import * as chartUtils from '../../chartUtils';

import {
  AnalysisCharts,
  AnalysisParams,
  AnalysisType,
  ChartJSAnalysisCharts,
  GeolocationChartData,
  QQChartData,
} from './ColumnAnalysisState';
import { createChart, isPlotly } from './columnAnalysisUtils';

/** Component properties for ColumnAnalysisChart */
interface ColumnAnalysisChartProps {
  fetchedChartData: AnalysisCharts;
  finalParams: AnalysisParams;
  height?: number;
  chartRef?: (chart?: chartUtils.ChartObj) => void;
}

export const ColumnAnalysisChart: React.FC<ColumnAnalysisChartProps> = ({
  fetchedChartData,
  finalParams,
  height,
  chartRef,
}) => {
  const id = `chart${new Date().getTime()}`;
  const [chart, setChart] = React.useState<chartUtils.ChartObj>();
  const dataTime = React.useRef<number>();

  const createAnalysisChart = (): void => {
    dataTime.current = fetchedChartData.timestamp;
    const builder = (ctx: HTMLCanvasElement): chartUtils.ChartObj | undefined => {
      if (finalParams.type === AnalysisType.GEOLOCATION) {
        chartUtils.createGeolocation(id, fetchedChartData as GeolocationChartData);
        return undefined;
      }
      if (finalParams.type === AnalysisType.QQ) {
        chartUtils.createQQ(id, fetchedChartData as QQChartData);
        return undefined;
      }
      if (!(fetchedChartData as any)?.data?.length && !(fetchedChartData as any)?.targets?.length) {
        return undefined;
      }
      return createChart(ctx, fetchedChartData as ChartJSAnalysisCharts, finalParams);
    };
    const newChart = chartUtils.chartWrapper(id, chart, builder);
    chartRef?.(newChart);
    setChart(newChart);
  };

  React.useEffect(() => {
    return () => chart?.destroy?.();
  }, []);

  React.useEffect(() => {
    if (dataTime.current !== fetchedChartData.timestamp) {
      createAnalysisChart();
    }
  }, [fetchedChartData, finalParams]);

  const plotly = isPlotly(finalParams?.type);
  return (
    <div style={{ height: height ?? 400 }} data-testid="column-analysis-chart">
      {plotly && <div id={id} />}
      {!plotly && <canvas id={id} />}
    </div>
  );
};
