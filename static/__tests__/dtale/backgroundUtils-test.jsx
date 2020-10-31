import { expect, it } from "@jest/globals";

import bu from "../../dtale/backgroundUtils";

describe("backgroundUtils tests", () => {
  const state = {};
  const rec = { view: "" };
  let colCfg = {};
  it("updateBackgroundStyles - heatmap-col", () => {
    state.backgroundMode = "heatmap-col";
    rec.view = "";
    expect(bu.updateBackgroundStyles(state, colCfg, rec)).toEqual({});
    rec.view = "7";
    rec.raw = 7;
    colCfg.min = 5;
    colCfg.max = 10;
    const output = bu.updateBackgroundStyles(state, colCfg, rec);
    expect(Array.from(output.background._rgb)).toEqual([255, 204, 0, 1]);
  });

  it("updateBackgroundStyles - dtypes", () => {
    state.backgroundMode = "dtypes";
    colCfg.dtype = "bool";
    let output = bu.updateBackgroundStyles(state, colCfg, rec);
    expect(output.background).toBe("#FFF59D");
    colCfg.dtype = "category";
    output = bu.updateBackgroundStyles(state, colCfg, rec);
    expect(output.background).toBe("#E1BEE7");
    colCfg.dtype = "timedelta";
    output = bu.updateBackgroundStyles(state, colCfg, rec);
    expect(output.background).toBe("#FFCC80");
    colCfg.dtype = "unknown";
    output = bu.updateBackgroundStyles(state, colCfg, rec);
    expect(output).toEqual({});
  });

  it("updateBackgroundStyles - missing", () => {
    state.backgroundMode = "missing";
    colCfg.dtype = "string";
    colCfg.hasMissing = true;
    rec.view = "";
    let output = bu.updateBackgroundStyles(state, colCfg, rec);
    expect(output.background).toBe("#FFCC80");
    rec.view = " ";
    output = bu.updateBackgroundStyles(state, colCfg, rec);
    expect(output.background).toBe("#FFCC80");
  });

  it("updateBackgroundStyles - outliers", () => {
    state.backgroundMode = "outliers";
    colCfg.dtype = "int";
    colCfg.hasOutliers = true;
    colCfg.outlierRange = { lower: 3, upper: 5 };
    colCfg = bu.buildOutlierScales(colCfg);
    rec.raw = 2;
    let output = bu.updateBackgroundStyles(state, colCfg, rec);
    expect(Array.from(output.background._rgb)).toEqual([255, 255, 255, 1]);
    rec.raw = 6;
    output = bu.updateBackgroundStyles(state, colCfg, rec);
    expect(Array.from(output.background._rgb)).toEqual([255, 204, 204, 1]);
    rec.raw = 4;
    output = bu.updateBackgroundStyles(state, colCfg, rec);
    expect(output).toEqual({});
  });
});
