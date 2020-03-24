import { mount } from "enzyme";
import _ from "lodash";
import moment from "moment";
import React from "react";

import { DateFilter } from "../../filters/DateFilter";
import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import { buildInnerHTML, withGlobalJquery } from "../test-utils";

describe("ColumnFilter date tests", () => {
  beforeAll(() => {
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        if (_.startsWith(url, "/dtale/column-filter-data/1/col4")) {
          return {
            success: true,
            hasMissing: true,
            min: "20000101",
            max: "20000131",
          };
        }
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);
  });

  test("ColumnFilter date rendering", done => {
    const ColumnFilter = require("../../filters/ColumnFilter").default;
    const DateInput = require("@blueprintjs/datetime").DateInput;

    buildInnerHTML();
    let props = {
      dataId: "1",
      selectedCol: "col4",
      columns: [{ name: "col4", dtype: "datetime64[ns]", visible: true }],
    };
    const propagateState = state => (props = _.assignIn(props, state));
    const result = mount(<ColumnFilter {...props} propagateState={propagateState} />, {
      attachTo: document.getElementById("content"),
    });
    setTimeout(() => {
      result.update();
      t.ok(result.find(DateFilter).length);
      result.find("i.ico-check-box-outline-blank").simulate("click");
      setTimeout(() => {
        result.update();
        t.ok(
          result
            .find(DateInput)
            .first()
            .instance().props.disabled
        );
        result.find("i.ico-check-box").simulate("click");
        setTimeout(() => {
          result.update();
          t.notOk(
            result
              .find(DateInput)
              .first()
              .instance().props.disabled
          );
          const dateStart = result
            .find(DateInput)
            .first()
            .instance();
          dateStart.inputEl.value = "200";
          dateStart.props.onChange("200");
          dateStart.inputEl.value = "20000102";
          dateStart.props.onChange(new Date(moment("20000102")));
          setTimeout(() => {
            result.update();
            t.deepEqual(result.state().cfg, {
              type: "date",
              start: "20000102",
              end: "20000131",
            });
            const dateEnd = result
              .find(DateInput)
              .last()
              .instance();
            dateEnd.inputEl.value = "20000103";
            dateEnd.props.onChange(new Date(moment("20000103")));
            setTimeout(() => {
              result.update();
              t.deepEqual(result.state().cfg, {
                type: "date",
                start: "20000102",
                end: "20000103",
              });
              done();
            }, 400);
          }, 400);
        }, 400);
      }, 400);
    }, 400);
  });
});
