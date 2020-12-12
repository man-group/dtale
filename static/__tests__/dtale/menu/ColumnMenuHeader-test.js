import { expect, it } from "@jest/globals";

import { skewMsg, kurtMsg } from "../../../dtale/column/ColumnMenuHeader";

describe("ColumnMenuHeader tests", () => {
  it("correctly renders skew message", () => {
    expect(skewMsg(0)).toBe(" (fairly symmetrical)");
    expect(skewMsg(-0.75)).toBe(" (moderately skewed)");
    expect(skewMsg(-2)).toBe(" (highly skewed)");
    expect(skewMsg("nan")).toBe("");
  });

  it("correctly renders kurtosis message", () => {
    expect(kurtMsg(4)).toBe(" (leptokurtic)");
    expect(kurtMsg(3)).toBe(" (mesokurtic)");
    expect(kurtMsg(2)).toBe(" (platykurtic)");
    expect(kurtMsg("nan")).toBe("");
  });
});
