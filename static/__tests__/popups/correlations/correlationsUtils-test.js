import { expect, it } from "@jest/globals";

import corrUtils from "../../../popups/correlations/correlationsUtils";

describe("correlationsUtils", () => {
  describe("findDummyCols", () => {
    it("correctly finds dummies", () => {
      const dummies = corrUtils.findDummyCols(["col1-a", "col2-b"], { col1: ["col1-a"], col2: ["col2-b"] });
      expect(dummies).toEqual(["col1", "col2"]);
    });

    it("correctly finds no dummies", () => {
      const dummies = corrUtils.findDummyCols(["col1", "col2"], { col1: ["col1-a"], col2: ["col2-b"] });
      expect(dummies).toEqual([]);
    });
  });
});
