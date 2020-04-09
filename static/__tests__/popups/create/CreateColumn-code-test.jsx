import { buildCode as buildBinsCode } from "../../../popups/create/CreateBins";
import { buildCode as buildDatetimeCode } from "../../../popups/create/CreateDatetime";
import { buildCode as buildNumericCode } from "../../../popups/create/CreateNumeric";
import { buildCode as buildTypeConversionCode } from "../../../popups/create/CreateTypeConversion";
import * as t from "../../jest-assertions";

describe("CreateColumn buildCode tests", () => {
  test("Numeric buildCode test", done => {
    let code = buildNumericCode({
      left: { type: "col", col: { value: "col1" } },
      operation: "sum",
      right: { type: "col", col: { value: "col2" } },
    });
    t.equal(code, "df['col1'] + df['col2']");
    code = buildNumericCode({
      left: { type: "col", col: null },
      operation: "sum",
      right: { type: "col", col: { value: "col2" } },
    });
    t.equal(code, null);
    code = buildNumericCode({
      left: { type: "col", col: { value: "col1" } },
      operation: "sum",
      right: { type: "col", col: null },
    });
    t.equal(code, null);
    code = buildNumericCode({
      left: { type: "val", val: "5" },
      operation: "sum",
      right: { type: "val", val: "6" },
    });
    t.equal(code, "5 + 6");
    code = buildNumericCode({
      left: { type: "val", val: null },
      operation: "sum",
      right: { type: "val", val: "6" },
    });
    t.equal(code, null);
    code = buildNumericCode({
      left: { type: "val", val: "5" },
      operation: "sum",
      right: { type: "val", val: null },
    });
    t.equal(code, null);
    done();
  });

  test("Datetime buildCode test", done => {
    let code = buildDatetimeCode({
      col: null,
      operation: null,
      property: null,
      conversion: null,
    });
    t.equal(code, null);
    code = buildDatetimeCode({
      col: { value: "col1" },
      operation: null,
      property: null,
      conversion: null,
    });
    t.equal(code, null);
    code = buildDatetimeCode({
      col: { value: "col1" },
      operation: null,
      property: null,
      conversion: "month_end",
    });
    t.equal(code, "df['col1'].dt.to_period('M').dt.to_timestamp(how='end')");
    code = buildDatetimeCode({
      col: { value: "col1" },
      operation: "property",
      property: null,
      conversion: "month_end",
    });
    t.equal(code, null);
    code = buildDatetimeCode({
      col: { value: "col1" },
      operation: "property",
      property: "hour",
      conversion: "month_end",
    });
    t.equal(code, "df['col1'].dt.hour");
    done();
  });

  test("Bins buildCode test", done => {
    let code = buildBinsCode({
      col: null,
      operation: null,
      bins: null,
      labels: null,
    });
    t.equal(code, null);
    code = buildBinsCode({
      col: { value: "col1" },
      operation: null,
      bins: null,
      labels: null,
    });
    t.equal(code, null);
    code = buildBinsCode({
      col: { value: "col1" },
      operation: "cut",
      bins: null,
      labels: null,
    });
    t.equal(code, null);
    code = buildBinsCode({
      col: { value: "col1" },
      operation: "cut",
      bins: "3",
      labels: null,
    });
    t.equal(code, "pd.cut(df['col1'], bins=3)");
    code = buildBinsCode({
      col: { value: "col1" },
      operation: "qcut",
      bins: "3",
      labels: null,
    });
    t.equal(code, "pd.qcut(df['col1'], q=3)");
    code = buildBinsCode({
      col: { value: "col1" },
      operation: "cut",
      bins: "3",
      labels: "foo,bar",
    });
    t.equal(code, null);
    code = buildBinsCode({
      col: { value: "col1" },
      operation: "cut",
      bins: "3",
      labels: "foo,bar,baz",
    });
    t.equal(code, "pd.cut(df['col1'], bins=3, labels=['foo', 'bar', 'baz'])");
    done();
  });

  test("TypeConversion buildCode test", done => {
    const code = buildTypeConversionCode({
      col: null,
      from: null,
      to: null,
      fmt: null,
      unit: null,
    });
    t.equal(code, null);
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
    done();
  });
});
