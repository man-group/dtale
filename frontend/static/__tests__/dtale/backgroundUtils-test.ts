import * as React from 'react';

import * as bu from '../../dtale/backgroundUtils';
import { ColumnDef, DataRecord } from '../../dtale/DataViewerState';
import { ThemeType } from '../../redux/state/AppState';
import { mockColumnDef } from '../mocks/MockColumnDef';

describe('backgroundUtils tests', () => {
  let rec: DataRecord;
  let colCfg: ColumnDef;
  let state: any;

  beforeEach(() => {
    rec = { view: '' };
    colCfg = mockColumnDef({ name: 'foo', dtype: 'float64' });
    state = {
      settings: {
        allow_cell_edits: true,
        precision: 2,
        verticalHeaders: false,
        predefinedFilters: {},
        backgroundMode: 'heatmap-col',
      },
      dataId: '1',
      iframe: false,
      closeColumnMenu: jest.fn(),
      openChart: jest.fn(),
      theme: ThemeType.LIGHT,
      updateFilteredRanges: jest.fn(),
      menuPinned: false,
      ribbonMenuOpen: false,
      clearDataViewerUpdate: jest.fn(),
      verticalHeaders: false,
    };
  });

  it('updateBackgroundStyles - heatmap-col', () => {
    expect(bu.updateBackgroundStyles(colCfg, rec, {}, state.settings)).toEqual({});
    colCfg = { ...colCfg, min: 5, max: 10 };
    rec = { view: '7', raw: 7 };
    const output: React.CSSProperties = bu.updateBackgroundStyles(colCfg, rec, {}, state.settings);
    expect(output.background).toBe('#ffcc00');
  });

  it('updateBackgroundStyles - dtypes', () => {
    state.settings.backgroundMode = 'dtypes';
    colCfg.dtype = 'bool';
    let output: React.CSSProperties = bu.updateBackgroundStyles(colCfg, rec, {}, state.settings);
    expect(output.background).toBe('#FFF59D');
    colCfg.dtype = 'category';
    output = bu.updateBackgroundStyles(colCfg, rec, {}, state.settings);
    expect(output.background).toBe('#E1BEE7');
    colCfg.dtype = 'timedelta';
    output = bu.updateBackgroundStyles(colCfg, rec, {}, state.settings);
    expect(output.background).toBe('#FFCC80');
    colCfg.dtype = 'unknown';
    output = bu.updateBackgroundStyles(colCfg, rec, {}, state.settings);
    expect(output).toEqual({});
  });

  it('updateBackgroundStyles - missing', () => {
    state.settings.backgroundMode = 'missing';
    colCfg = { ...colCfg, dtype: 'string', hasMissing: 1 };
    let output: React.CSSProperties = bu.updateBackgroundStyles(colCfg, rec, {}, state.settings);
    expect(output.background).toBe('#FFCC80');
    rec.view = ' ';
    output = bu.updateBackgroundStyles(colCfg, rec, {}, state.settings);
    expect(output.background).toBe('#FFCC80');
  });

  it('updateBackgroundStyles - outliers', () => {
    state.settings.backgroundMode = 'outliers';
    colCfg = { ...colCfg, dtype: 'int', hasOutliers: 1, min: 1, max: 10, outlierRange: { lower: 3, upper: 5 } };
    colCfg = bu.buildOutlierScales(colCfg);
    rec.raw = 2;
    let output: React.CSSProperties = bu.updateBackgroundStyles(colCfg, rec, {}, state.settings);
    expect(output.background).toBe('#8fc8ff');
    rec.raw = 6;
    output = bu.updateBackgroundStyles(colCfg, rec, {}, state.settings);
    expect(output.background).toBe('#ffcccc');
    rec.raw = 4;
    output = bu.updateBackgroundStyles(colCfg, rec, {}, state.settings);
    expect(output).toEqual({});
  });

  it('updateBackgroundStyles - highlightFilter', () => {
    state.settings.backgroundMode = 'outliers';
    state.settings.highlightFilter = true;
    colCfg = { ...colCfg, dtype: 'int', hasOutliers: 1, min: 1, max: 10, outlierRange: { lower: 3, upper: 5 } };
    colCfg = bu.buildOutlierScales(colCfg);
    rec.raw = 2;
    let output: React.CSSProperties = bu.updateBackgroundStyles(
      colCfg,
      rec,
      { __filtered: { view: 'true', raw: true } },
      state.settings,
    );
    expect(output.background).toBe('#FFF59D');
    rec.raw = 6;
    output = bu.updateBackgroundStyles(colCfg, rec, {}, state.settings);
    expect(output.background).toBe('#ffcccc');
    rec.raw = 4;
    state.settings.highlightFilter = false;
    output = bu.updateBackgroundStyles(colCfg, rec, { __filtered: { view: 'true', raw: true } }, state.settings);
    expect(output).toEqual({});
  });
});
