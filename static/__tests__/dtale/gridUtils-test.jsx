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
        resized: true,
      });
    });

    it("column unaffected", () => {
      measureTextSpy.mockImplementation(() => 50);
      expect(gu.calcColWidth({}, { maxColumnWidth: 100 })).toEqual({
        width: 50,
      });
    });
  });
});
