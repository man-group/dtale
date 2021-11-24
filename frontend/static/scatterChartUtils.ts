import { ChartDataset, Color, ScatterDataPoint } from 'chart.js';

/**
 * Builds a formatter which will take extract properties from objects and return them in the form of x/y coords.
 *
 * @param xProp name of the property holding the x-coordinate.
 * @param yProp name of the property holding the y-coordinate.
 * @return handler that extracts x/y coordinates for Scatter charts.
 */
export const basePointFormatter =
  (xProp: string, yProp: string): ((point: Record<string, any>) => ScatterDataPoint) =>
  (point: Record<string, any>): ScatterDataPoint => ({ ...point, x: point[xProp], y: point[yProp] });

/** Placeholder for any points we want highlighted in the scatter chart */
interface HighlightConfig {
  bg: Color;
  rad: number;
  hoverRad: number;
  hitRad: number;
  d: ScatterDataPoint;
}

/**
 * Format data for presentation in chart.js scatter chart.
 *
 * @param chartData the input data to be formatted
 * @param formatter any additional formatting to be applied to each point
 * @param highlight which points need to be highlighted
 * @param filter which points need to be filtered
 * @return data for scatter chart
 */
export function formatScatterPoints(
  chartData: ScatterDataPoint[],
  formatter?: (p: ScatterDataPoint) => ScatterDataPoint,
  highlight?: (p: ScatterDataPoint) => boolean,
  filter?: (p: ScatterDataPoint) => boolean,
): ChartDataset<'scatter', ScatterDataPoint[]> {
  const data: ScatterDataPoint[] = [];
  const pointBackgroundColor: Color[] = [];
  const pointRadius: number[] = [];
  const pointHoverRadius: number[] = [];
  const pointHitRadius: number[] = [];

  const highlighted: HighlightConfig[] = [];
  chartData.forEach((p: ScatterDataPoint) => {
    let bg = 'rgb(42, 145, 209)';
    let rad = 3;
    let hoverRad = 4;
    let hitRad = 1; // Chart.js default values
    const isHighlighted = highlight?.(p);
    if (isHighlighted) {
      bg = '#b73333';
      rad = 5;
      hoverRad = 6;
      hitRad = 6;
    }

    if (filter?.(p)) {
      rad = hoverRad = hitRad = 0;
    }
    const d: ScatterDataPoint = formatter?.(p) ?? p;
    if (isHighlighted) {
      highlighted.push({ bg, rad, hoverRad, hitRad, d });
    } else {
      pointBackgroundColor.push(bg);
      pointRadius.push(rad);
      pointHoverRadius.push(hoverRad);
      pointHitRadius.push(hitRad);
      data.push(d);
    }
  });

  // highlighted items in the fore-front
  highlighted.forEach((h) => {
    const { bg, rad, hoverRad, hitRad, d } = h;
    pointBackgroundColor.push(bg);
    pointRadius.push(rad);
    pointHoverRadius.push(hoverRad);
    pointHitRadius.push(hitRad);
    data.push(d);
  });

  return {
    data,
    pointBackgroundColor,
    pointRadius,
    pointHoverRadius,
    pointHitRadius,
    pointHoverBackgroundColor: pointBackgroundColor,
  };
}

/**
 * Calculate the minimum value for a specific property contained in an array of objects or values.
 * @param data the array containing the minimum
 * @param prop the name of the property to extract the minimum from.
 * @return minimum value
 */
export function getScatterMin(data: Array<Record<string, number>> | number[], prop?: string): number {
  const min = prop
    ? Math.min(...(data as Array<Record<string, number>>).map((d) => d[prop]))
    : Math.min(...(data as number[]));
  return Math.floor(min + (min % 1 ? 0 : -1)) - 0.5;
}

/**
 * Calculate the maximum value for a specific property contained in an array of objects or values.
 * @param data the array containing the maximum
 * @param prop the name of the property to extract the maximum from.
 * @return maximum value
 */
export function getScatterMax(data: Array<Record<string, number>> | number[], prop?: string): number {
  const max = prop
    ? Math.max(...(data as Array<Record<string, number>>).map((d) => d[prop]))
    : Math.max(...(data as number[]));
  return Math.ceil(max + (max % 1 ? 0 : 1)) + 0.5;
}
