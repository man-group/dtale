import { expect, it } from "@jest/globals";

import { buildCode as buildBinsCode } from "../../../popups/create/CreateBins";
import { buildCode as buildDatetimeCode } from "../../../popups/create/CreateDatetime";
import { buildCode as buildNumericCode } from "../../../popups/create/CreateNumeric";
import { buildCode as buildStringCode } from "../../../popups/create/CreateString";
import { default as buildTypeConversionCode } from "../../../popups/create/typeConversionCodeUtils";

describe("CreateColumn buildCode tests", () => {
  it("String buildCode tests", () => {
    const code = buildStringCode({ cols: [], joinChar: "-" });
    expect(code).toBeNull();
  });

  it("Numeric buildCode test", () => {
    let code = buildNumericCode({
      left: { type: "col", col: { value: "col1" } },
      operation: "sum",
      right: { type: "col", col: { value: "col2" } },
    });
    expect(code).toBe("df['col1'] + df['col2']");
    code = buildNumericCode({
      left: { type: "col", col: null },
      operation: "sum",
      right: { type: "col", col: { value: "col2" } },
    });
    expect(code).toBeNull();
    code = buildNumericCode({
      left: { type: "col", col: { value: "col1" } },
      operation: "sum",
      right: { type: "col", col: null },
    });
    expect(code).toBeNull();
    code = buildNumericCode({
      left: { type: "val", val: "5" },
      operation: "sum",
      right: { type: "val", val: "6" },
    });
    expect(code).toBe("5 + 6");
    code = buildNumericCode({
      left: { type: "val", val: null },
      operation: "sum",
      right: { type: "val", val: "6" },
    });
    expect(code).toBeNull();
    code = buildNumericCode({
      left: { type: "val", val: "5" },
      operation: "sum",
      right: { type: "val", val: null },
    });
    expect(code).toBeNull();
  });

  it("Datetime buildCode test", () => {
    let code = buildDatetimeCode({
      col: null,
      operation: null,
      property: null,
      conversion: null,
    });
    expect(code).toBeNull();
    code = buildDatetimeCode({
      col: { value: "col1" },
      operation: null,
      property: null,
      conversion: null,
    });
    expect(code).toBeNull();
    code = buildDatetimeCode({
      col: { value: "col1" },
      operation: null,
      property: null,
      conversion: "month_end",
    });
    expect(code).toBe("df['col1'].dt.to_period('M').dt.to_timestamp(how='end')");
    code = buildDatetimeCode({
      col: { value: "col1" },
      operation: "property",
      property: null,
      conversion: "month_end",
    });
    expect(code).toBeNull();
    code = buildDatetimeCode({
      col: { value: "col1" },
      operation: "property",
      property: "hour",
      conversion: "month_end",
    });
    expect(code).toBe("df['col1'].dt.hour");
  });

  it("Bins buildCode test", () => {
    let code = buildBinsCode({
      col: null,
      operation: null,
      bins: null,
      labels: null,
    });
    expect(code).toBeNull();
    code = buildBinsCode({
      col: { value: "col1" },
      operation: null,
      bins: null,
      labels: null,
    });
    expect(code).toBeNull();
    code = buildBinsCode({
      col: { value: "col1" },
      operation: "cut",
      bins: null,
      labels: null,
    });
    expect(code).toBeNull();
    code = buildBinsCode({
      col: { value: "col1" },
      operation: "cut",
      bins: "3",
      labels: null,
    });
    expect(code).toBe("pd.cut(df['col1'], bins=3)");
    code = buildBinsCode({
      col: { value: "col1" },
      operation: "qcut",
      bins: "3",
      labels: null,
    });
    expect(code).toBe("pd.qcut(df['col1'], q=3)");
    code = buildBinsCode({
      col: { value: "col1" },
      operation: "cut",
      bins: "3",
      labels: "foo,bar",
    });
    expect(code).toBeNull();
    code = buildBinsCode({
      col: { value: "col1" },
      operation: "cut",
      bins: "3",
      labels: "foo,bar,baz",
    });
    expect(code).toBe("pd.cut(df['col1'], bins=3, labels=['foo', 'bar', 'baz'])");
  });

  it("TypeConversion buildCode test", () => {
    const code = buildTypeConversionCode({
      col: null,
      from: null,
      to: null,
      fmt: null,
      unit: null,
    });
    expect(code).toBeNull();
    buildTypeConversionCode({
      col: "col1",
      from: "object",
      to: "date",
      fmt: null,
      unit: null,
    });
    buildTypeConversionCode({
      col: "col1",
      from: "object",
      to: "int",
      fmt: null,
      unit: null,
    });
    buildTypeConversionCode({
      col: "col1",
      from: "object",
      to: "float",
      fmt: null,
      unit: null,
    });
    buildTypeConversionCode({
      col: "col1",
      from: "int",
      to: "date",
      fmt: null,
      unit: "YYYYMMDD",
    });
    buildTypeConversionCode({
      col: "col1",
      from: "int",
      to: "date",
      fmt: null,
      unit: null,
    });
    buildTypeConversionCode({
      col: "col1",
      from: "int",
      to: "float",
      fmt: null,
      unit: null,
    });
    buildTypeConversionCode({
      col: "col1",
      from: "date",
      to: "int",
      fmt: null,
      unit: "YYYYMMDD",
    });
    buildTypeConversionCode({
      col: "col1",
      from: "date",
      to: "int",
      fmt: null,
      unit: null,
    });
    buildTypeConversionCode({
      col: "col1",
      from: "date",
      to: "int",
      fmt: "%m/%d/%Y",
      unit: null,
    });
    buildTypeConversionCode({
      col: "col1",
      from: "float64",
      to: "int",
      fmt: null,
      unit: null,
    });
    buildTypeConversionCode({
      col: "col1",
      from: "bool",
      to: "int",
      fmt: null,
      unit: null,
    });
  });
});
