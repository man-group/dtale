import { expect, it } from "@jest/globals";

import * as measureText from "../../dtale/MeasureText";
import * as gu from "../../dtale/gridUtils";

describe("gridUtils tests", () => {
  it("gridUtils: testing buildDataProps", () => {
    let dataProps = gu.buildDataProps({ name: "foo", dtype: "foo" }, "bar", {
      columnFormats: {},
    });
    expect({ raw: "bar", view: "bar", style: {} }).toEqual(dataProps);
    dataProps = gu.buildDataProps({ name: "foo", dtype: "foo" }, undefined, {
      columnFormats: {},
    });
    expect(dataProps.view).toBe("");
  });

  it("gridUtils: calcColWidth resized", () => {
    expect(gu.calcColWidth({ resized: true, width: 100 }, {})).toEqual({
      width: 100,
    });
  });

  describe("maxColumnWidth", () => {
    let measureTextSpy;

    beforeEach(() => {
      measureTextSpy = jest.spyOn(measureText, "measureText");
    });

    afterEach(jest.resetAllMocks);

    afterAll(jest.restoreAllMocks);

    it("column truncated", () => {
      measureTextSpy.mockImplementation(() => 150);
      expect(gu.calcColWidth({}, { maxColumnWidth: 100 })).toEqual({
        width: 100,
        dataWidth: 70,
        headerWidth: 150,
        resized: true,
      });
    });

    it("column unaffected", () => {
      measureTextSpy.mockImplementation(() => 50);
      expect(gu.calcColWidth({}, { maxColumnWidth: 100 })).toEqual({
        width: 70,
        dataWidth: 70,
        headerWidth: 50,
      });
    });
  });

  describe("verticalHeaders", () => {
    const columns = [
      { index: 0, visible: true },
      { index: 1, width: 100, headerWidth: 100, dataWidth: 75, visible: true },
    ];
    it("getColWidth", () => {
      const width = gu.getColWidth(1, { columns }, { verticalHeaders: true });
      expect(width).toEqual(75);
    });

    it("getRowHeight", () => {
      let height = gu.getRowHeight(0, { columns }, { verticalHeaders: true });
      expect(height).toEqual(100);
      height = gu.getRowHeight(0, { columns }, { verticalHeaders: false });
      expect(height).toEqual(gu.HEADER_HEIGHT);
    });
  });
});
