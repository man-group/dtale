import chroma from 'chroma-js';
import * as React from 'react';

import { BASE_COLOR, MODES } from '../popups/RangeHighlight';
import { InstanceSettings, RangeHighlightConfig, RangeHighlightModes } from '../redux/state/AppState';

import { Bounds, ColumnDef, DataRecord, OutlierRange } from './DataViewerState';
import * as gu from './gridUtils';

export const missingIcon = String.fromCodePoint(10071); // "!" emoji
export const outlierIcon = String.fromCodePoint(11088); // star emoji
export const flagIcon = String.fromCodePoint(128681); // flag emoji

export const RESIZABLE = ['outliers', 'missing'];

const heatMap = chroma.scale(['red', 'yellow', 'green']).domain([0, 0.5, 1]);

const heatMapBackground = (record: DataRecord, range: Bounds): React.CSSProperties => {
  if (record.view === '') {
    return {};
  }
  const { min, max } = range;
  const factor = min! * -1;
  return { background: heatMap(((record.raw! as number) + factor) / (max! + factor)).hex() };
};

export const dtypeHighlighting = (column?: ColumnDef): React.CSSProperties => {
  if (column?.name === gu.IDX) {
    return {};
  }
  const lowerDtype = (column?.dtype || '').toLowerCase();
  const colType = gu.findColType(lowerDtype);
  if (lowerDtype.indexOf('category') === 0) {
    return { background: '#E1BEE7' };
  } else if (lowerDtype.indexOf('timedelta') === 0) {
    return { background: '#FFCC80' };
  } else if (colType === gu.ColumnType.FLOAT) {
    return { background: '#B2DFDB' };
  } else if (colType === gu.ColumnType.INT) {
    return { background: '#BBDEFB' };
  } else if (colType === gu.ColumnType.DATE) {
    return { background: '#F8BBD0' };
  } else if (colType === gu.ColumnType.STRING) {
    return {};
  } else if (lowerDtype.indexOf('bool') === 0) {
    return { background: '#FFF59D' };
  }
  return {};
};

const missingHighlighting = (column: ColumnDef, value: any): React.CSSProperties => {
  const { name, dtype, hasMissing } = column;
  if (name === gu.IDX || !hasMissing) {
    return {};
  }
  if (value === 'nan') {
    return { background: '#FFF59D' };
  }
  const lowerDtype = (dtype || '').toLowerCase();
  const colType = gu.findColType(lowerDtype);
  if (colType === gu.ColumnType.STRING) {
    if ((value || '') === '') {
      return { background: '#FFCC80' };
    }
    if (value.trim() === '') {
      return { background: '#FFCC80' };
    }
  }
  return {};
};

export const buildOutlierScales = (colCfg: ColumnDef): ColumnDef => {
  const { name, min, max, hasOutliers, outlierRange } = colCfg;
  const updatedColCfg = { ...colCfg };
  if (name === gu.IDX || !hasOutliers) {
    return updatedColCfg;
  }
  if (outlierRange && outlierRange.lowerScale === undefined) {
    updatedColCfg.outlierRange = {
      ...updatedColCfg.outlierRange,
      lowerScale: chroma.scale(['dodgerblue', 'white']).domain([min!, outlierRange.lower]),
    } as OutlierRange;
  }
  if (outlierRange && outlierRange.upperScale === undefined) {
    updatedColCfg.outlierRange = {
      ...updatedColCfg.outlierRange,
      upperScale: chroma.scale(['white', 'red']).domain([outlierRange.upper, max!]),
    } as OutlierRange;
  }
  return updatedColCfg;
};

const outlierHighlighting = (column: ColumnDef, record: DataRecord): React.CSSProperties => {
  const { name, dtype, hasOutliers, outlierRange } = column;
  const raw = record.raw as number;
  if (name === gu.IDX || !hasOutliers) {
    return {};
  }
  const lowerDtype = (dtype || '').toLowerCase();
  const colType = gu.findColType(lowerDtype);
  if ([gu.ColumnType.FLOAT, gu.ColumnType.INT].includes(colType)) {
    if (outlierRange && raw < outlierRange.lower) {
      return { background: outlierRange.lowerScale?.(raw).hex() };
    } else if (outlierRange && raw > outlierRange.upper) {
      return { background: outlierRange.upperScale?.(raw).hex() };
    }
  }
  return {};
};

/** Internal characteristics of a range highlight mode */
type RangeHighlightMode = [string, keyof RangeHighlightModes, (raw: number, value: number) => boolean];

const rangeHighlighting = (
  rangeHighlight: RangeHighlightConfig | undefined,
  column: ColumnDef,
  record: DataRecord,
): React.CSSProperties => {
  const { name, dtype } = column;
  const raw = record.raw as number;
  if (name === gu.IDX || !rangeHighlight) {
    return {};
  }
  let range: RangeHighlightModes;
  if (rangeHighlight[name]?.active) {
    range = rangeHighlight[name];
  } else if (rangeHighlight.all?.active) {
    range = rangeHighlight.all;
  } else {
    return {};
  }
  const lowerDtype = (dtype || '').toLowerCase();
  const colType = gu.findColType(lowerDtype);
  if ([gu.ColumnType.FLOAT, gu.ColumnType.INT].includes(colType)) {
    let styles: React.CSSProperties = {};
    (MODES as RangeHighlightMode[]).forEach((mode) => {
      const { active, value, color } = range[mode[1]];
      if (active && value !== null && value !== undefined && mode[2](raw, value)) {
        const { r, g, b, a } = color ?? BASE_COLOR;
        styles = { background: `rgba(${r},${g},${b},${a})` };
      }
    });
    return styles;
  }
  return {};
};

const lowVarianceHighlighting = (column: ColumnDef): React.CSSProperties => {
  const { name, lowVariance } = column;
  if (name === gu.IDX || !lowVariance) {
    return {};
  }
  return { background: 'rgb(255, 128, 128)' };
};

export const updateBackgroundStyles = (
  colCfg: ColumnDef,
  rec: DataRecord,
  row: Record<string, DataRecord>,
  settings: InstanceSettings,
  min?: number,
  max?: number,
): React.CSSProperties => {
  if (settings.highlightFilter && row.__filtered?.raw) {
    return { background: '#FFF59D' };
  }
  switch (settings.backgroundMode) {
    case `heatmap-col-${colCfg.name}`:
      return heatMapBackground(rec, {
        ...colCfg,
        ...settings.filteredRanges?.ranges?.[colCfg.name],
      });
    case 'heatmap-col':
    case 'heatmap-col-all':
      return heatMapBackground(rec, {
        ...colCfg,
        ...settings.filteredRanges?.ranges?.[colCfg.name],
      });
    case 'heatmap-all':
    case 'heatmap-all-all': {
      const overall = {
        min: settings.filteredRanges?.overall?.min ?? min,
        max: settings.filteredRanges?.overall?.max ?? max,
      };
      return colCfg.name === gu.IDX ? {} : heatMapBackground(rec, overall);
    }
    case 'dtypes':
      return dtypeHighlighting(colCfg);
    case 'missing':
      return missingHighlighting(colCfg, rec.view);
    case 'outliers':
      return outlierHighlighting(colCfg, rec);
    case 'range':
      return rangeHighlighting(settings.rangeHighlight, colCfg, rec);
    case 'lowVariance':
      return lowVarianceHighlighting(colCfg);
    default:
      return {};
  }
};
