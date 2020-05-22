import _ from "lodash";

import { expect, it } from "@jest/globals";

import { buildCode as buildImputerCode } from "../../../popups/replacement/Imputer";
import { buildCode as buildSpacesCode } from "../../../popups/replacement/Spaces";
import { buildCode as buildStringsCode } from "../../../popups/replacement/Strings";
import { buildCode as buildValueCode } from "../../../popups/replacement/Value";

describe("CreateReplacement buildCode tests", () => {
  it("Spaces buildCode test", () => {
    let code = buildSpacesCode("foo", { replace: "a" });
    expect(code).toBe("df.loc[:, 'foo'] = df['foo'].replace(r'^\\\\s+$', 'a', regex=True)");

    code = buildSpacesCode("foo", { replace: "nan" });
    expect(code).toBe("df.loc[:, 'foo'] = df['foo'].replace(r'^\\\\s+$', np.nan, regex=True)");

    code = buildSpacesCode("foo", { replace: null });
    expect(code).toBeNull();
  });

  it("Value buildCode test", () => {
    let code = buildValueCode("foo", "string", [{ type: "raw", value: "nan", replace: "foo" }]);
    expect(code).toStrictEqual(["s = df['foo']", "s = s.replace({", "\tnp.nan: 'foo',", "})"]);
    code = buildValueCode("foo", "string", []);
    expect(code).toBeNull();
    code = buildValueCode("foo", "string", [{ type: "raw", value: "a", replace: "foo" }]);
    expect(code).toStrictEqual(["s = df['foo']", "s = s.replace({", "\t'a': 'foo',", "})"]);
    code = buildValueCode("foo", "float", [{ type: "raw", value: 1.5, replace: 1.0 }]);
    expect(code).toStrictEqual(["s = df['foo']", "s = s.replace({", "\t1.5: 1,", "})"]);
    code = buildValueCode("foo", "float", [{ type: "col", value: 1.5, replace: "a" }]);
    expect(code).toStrictEqual(["s = df['foo']", "s = np.where(s == 1.5, data['a'], s)"]);
    code = buildValueCode("foo", "float", [{ type: "agg", value: 1.5, replace: "median" }]);
    expect(code).toStrictEqual(["s = df['foo']", "s = s.replace({", "\t1.5: getattr(df['foo'], 'median')(),", "})"]);
  });

  it("Strings buildCode test", () => {
    let cfg = { value: null, isChar: false, ignoreCase: false, replace: "nan" };
    let code = buildStringsCode("foo", "string", cfg);
    expect(code).toBeNull();
    cfg.value = "foo";
    code = buildStringsCode("foo", "string", cfg);
    expect(_.takeRight(code, 2)).toStrictEqual([
      `regex_pat = re.compile(r'^ *' + re.escape('foo') + ' *$', flags=re.UNICODE)`,
      `df.loc[:, 'foo'] = df['foo'].replace(regex_pat, np.nan, regex=True)`,
    ]);
    cfg = { value: "f", isChar: true, ignoreCase: true, replace: "bizz" };
    code = buildStringsCode("foo", "string", cfg);
    expect(_.takeRight(code, 2)).toStrictEqual([
      `regex_pat = re.compile(r'^ *[' + re.escape('f') + ']+ *$', flags=re.UNICODE | re.IGNORECASE)`,
      `df.loc[:, 'foo'] = df['foo'].replace(regex_pat, 'bizz', regex=True)`,
    ]);
  });

  it("Imputer buildCode test", () => {
    let code = buildImputerCode("foo", { type: "iterative" });
    expect(code).toStrictEqual([
      "from sklearn.experimental import enable_iterative_imputer",
      "from sklearn.impute import IterativeImputer",
      "",
      "output = IterativeImputer().fit_transform(df[['foo']])",
      "df.loc[:, 'foo'] = pd.DataFrame(output, columns=['foo'], index=df.index)['foo']",
    ]);
    code = buildImputerCode("foo", { type: "knn", nNeighbors: 3 });
    expect(_.take(code, 3)).toStrictEqual([
      "from sklearn.impute import KNNImputer",
      "",
      "output = KNNImputer(n_neighbors=3).fit_transform(df[['foo']])",
    ]);
    code = buildImputerCode("foo", { type: "simple" });
    expect(_.take(code, 3)).toStrictEqual([
      "from sklearn.impute import SimpleImputer",
      "",
      "output = SimpleImputer().fit_transform(df[['foo']])",
    ]);
  });
});
