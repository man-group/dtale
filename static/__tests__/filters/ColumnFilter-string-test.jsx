import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import Select from "react-select";

import { StringFilter } from "../../filters/StringFilter";
import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import { buildInnerHTML, withGlobalJquery } from "../test-utils";

describe("ColumnFilter string tests", () => {
  beforeAll(() => {
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        if (_.startsWith(url, "/dtale/column-filter-data/1/col3")) {
          return { success: true, hasMissing: true, uniques: ["a", "b", "c"] };
        }
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);
  });

  test("ColumnFilter string rendering", done => {
    const ColumnFilter = require("../../filters/ColumnFilter").default;

    buildInnerHTML();
    let props = {
      dataId: "1",
      selectedCol: "col3",
      columns: [{ name: "col3", dtype: "object", visible: true }],
      columnFilters: { col3: { value: ["b"] } },
    };
    const propagateState = state => (props = _.assignIn(props, state));
    const result = mount(<ColumnFilter {...props} propagateState={propagateState} />, {
      attachTo: document.getElementById("content"),
    });
    setTimeout(() => {
      result.update();
      t.ok(result.find(StringFilter).length);
      result.find("i.ico-check-box-outline-blank").simulate("click");
      setTimeout(() => {
        result.update();
        t.ok(result.find(".Select__control--is-disabled").length);
        result.find("i.ico-check-box").simulate("click");
        setTimeout(() => {
          result.update();
          t.notOk(result.find(".Select__control--is-disabled").length);
          const uniqueSelect = result.find(Select);
          uniqueSelect
            .first()
            .instance()
            .onChange([{ value: "a" }]);
          setTimeout(() => {
            result.update();
            t.deepEqual(result.state().cfg, {
              type: "string",
              operand: "=",
              value: ["a"],
            });
            result.find("button").last().simulate("click");
            setTimeout(() => {
              result.update();
              t.deepEqual(result.state().cfg, {
                type: "string",
                operand: "ne",
                value: ["a"],
              });
              done();
            }, 400);
          }, 400);
        }, 400);
      }, 400);
    }, 400);
  });
});
