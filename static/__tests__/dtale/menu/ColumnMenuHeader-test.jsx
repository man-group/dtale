import { mount } from "enzyme";

import { expect, it } from "@jest/globals";

import { kurtMsg, skewMsg } from "../../../dtale/column/ColumnMenuHeader";

describe("ColumnMenuHeader tests", () => {
  it("correctly renders skew message", () => {
    expect(mount(skewMsg(0)).find("span").text()).toBe("(fairly symmetrical)");
    expect(skewMsg(0, true)).toEqual(expect.stringContaining("(fairly symmetrical)"));
    expect(mount(skewMsg(-0.75)).find("span").text()).toBe("(moderately skewed)");
    expect(mount(skewMsg(0.7)).find("span").text()).toBe("(moderately skewed)");
    expect(mount(skewMsg(-2)).find("span").text()).toBe("(highly skewed)");
    expect(skewMsg("nan")).toBe("");
  });

  it("correctly renders kurtosis message", () => {
    expect(mount(kurtMsg(4)).find("span").text()).toBe("(leptokurtic)");
    expect(kurtMsg(4, true)).toEqual(expect.stringContaining("(leptokurtic)"));
    expect(mount(kurtMsg(3)).find("span").text()).toBe("(mesokurtic)");
    expect(mount(kurtMsg(2)).find("span").text()).toBe("(platykurtic)");
    expect(kurtMsg("nan")).toBe("");
  });
});
