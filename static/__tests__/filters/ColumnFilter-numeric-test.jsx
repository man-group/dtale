import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import Select from "react-select";

import { NumericFilter } from "../../filters/NumericFilter";
import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import { buildInnerHTML, withGlobalJquery } from "../test-utils";

describe("ColumnFilter numeric tests", () => {
  beforeAll(() => {
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        if (_.startsWith(url, "/dtale/column-filter-data/1/col1")) {
          return {
            success: true,
            hasMissing: true,
            uniques: [1, 2, 3],
            min: 1,
            max: 3,
          };
        }
        if (_.startsWith(url, "/dtale/column-filter-data/1/col2")) {
          return { success: true, hasMissing: true, min: 1.0, max: 3.0 };
        }
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);
  });

  test("ColumnFilter int rendering", done => {
    const ColumnFilter = require("../../filters/ColumnFilter").default;

    buildInnerHTML();
    let props = {
      dataId: "1",
      selectedCol: "col1",
      columns: [{ name: "col1", dtype: "int64", visible: true }],
    };
    const propagateState = state => (props = _.assignIn(props, state));
    const result = mount(<ColumnFilter {...props} propagateState={propagateState} />, {
      attachTo: document.getElementById("content"),
    });
    setTimeout(() => {
      result.update();
      t.ok(result.find(NumericFilter).length);
      result.find("i.ico-check-box-outline-blank").simulate("click");
      setTimeout(() => {
        result.update();
        t.deepEqual(result.state().cfg, { type: "int", missing: true });
        t.ok(result.find(".Select__control--is-disabled").length);
        result.find("i.ico-check-box").simulate("click");
        setTimeout(() => {
          result.update();
          t.notOk(result.find(".Select__control--is-disabled").length);
          const uniqueSelect = result.find(Select);
          uniqueSelect
            .first()
            .instance()
            .onChange([{ value: 1 }]);
          setTimeout(() => {
            result.update();
            t.deepEqual(result.state().cfg, {
              type: "int",
              operand: "=",
              value: [1],
            });
            result
              .find(NumericFilter)
              .find("div.row")
              .first()
              .find("button")
              .at(2)
              .simulate("click");
            setTimeout(() => {
              result.update();
              result
                .find(NumericFilter)
                .find("input")
                .first()
                .simulate("change", { target: { value: "a" } });
              result
                .find(NumericFilter)
                .find("input")
                .first()
                .simulate("change", { target: { value: "0" } });
              setTimeout(() => {
                result.update();
                t.deepEqual(result.state().cfg, {
                  type: "int",
                  operand: ">",
                  value: 0,
                });
                done();
              }, 400);
            }, 400);
          }, 400);
        }, 400);
      }, 400);
    }, 400);
  });

  test("ColumnFilter float rendering", done => {
    const ColumnFilter = require("../../filters/ColumnFilter").default;

    buildInnerHTML();
    let props = {
      dataId: "1",
      selectedCol: "col2",
      columns: [{ name: "col2", dtype: "float64", min: 2.5, max: 5.5, visible: true }],
    };

    const propagateState = state => (props = _.assignIn(props, state));
    const result = mount(<ColumnFilter {...props} propagateState={propagateState} />, {
      attachTo: document.getElementById("content"),
    });
    setTimeout(() => {
      result.update();
      t.ok(result.find(NumericFilter).length);
      result.find("i.ico-check-box-outline-blank").simulate("click");
      setTimeout(() => {
        result.update();
        t.ok(
          result
            .find("input")
            .first()
            .props().disabled
        );
        result.find("i.ico-check-box").simulate("click");
        setTimeout(() => {
          result.update();
          t.notOk(
            result
              .find("input")
              .first()
              .props().disabled
          );
          result
            .find(NumericFilter)
            .find("input")
            .first()
            .simulate("change", { target: { value: "1.1" } });
          setTimeout(() => {
            result.update();
            t.deepEqual(result.state().cfg, {
              type: "float",
              operand: "=",
              value: 1.1,
            });
            result
              .find(NumericFilter)
              .find("div.row")
              .first()
              .find("button")
              .last()
              .simulate("click");
            setTimeout(() => {
              result.update();
              result
                .find(NumericFilter)
                .find("input")
                .first()
                .simulate("change", { target: { value: "1.2" } });
              setTimeout(() => {
                result.update();
                t.deepEqual(result.state().cfg, {
                  type: "float",
                  operand: "()",
                  min: 1.2,
                  max: 3,
                });
                result
                  .find(NumericFilter)
                  .find("input")
                  .first()
                  .simulate("change", { target: { value: "a" } });
                result
                  .find(NumericFilter)
                  .find("input")
                  .last()
                  .simulate("change", { target: { value: "b" } });
                setTimeout(() => {
                  result.update();
                  t.deepEqual(result.state().cfg, { type: "float" });
                  done();
                }, 400);
              }, 400);
            }, 400);
          }, 400);
        }, 400);
      }, 400);
    }, 400);
  });
});
