import { expect, it } from "@jest/globals";

import { exports as gu } from "../../dtale/gridUtils";

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
});
