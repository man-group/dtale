import { mount } from "enzyme";
import _ from "lodash";
import moment from "moment";
import React from "react";

import { expect, it } from "@jest/globals";

import DateFilter from "../../filters/DateFilter";
import mockPopsicle from "../MockPopsicle";
import { buildInnerHTML, tickUpdate, withGlobalJquery } from "../test-utils";

describe("ColumnFilter date tests", () => {
  let ColumnFilter, DateInput;

  beforeAll(() => {
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        if (_.startsWith(url, "/dtale/column-filter-data/1?col=col4")) {
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
    ColumnFilter = require("../../filters/ColumnFilter").default;
    DateInput = require("@blueprintjs/datetime").DateInput;
  });

  it("ColumnFilter date rendering", async () => {
    buildInnerHTML();
    let props = {
      dataId: "1",
      selectedCol: "col4",
      columns: [{ name: "col4", dtype: "datetime64[ns]", visible: true }],
      updateSettings: jest.fn(),
    };
    const propagateState = state => (props = _.assignIn(props, state));
    const result = mount(<ColumnFilter {...props} propagateState={propagateState} />, {
      attachTo: document.getElementById("content"),
    });
    await tickUpdate(result);
    expect(result.find(DateFilter).length).toBeGreaterThan(0);
    result.find("i.ico-check-box-outline-blank").simulate("click");
    await tickUpdate(result);
    expect(result.find(DateInput).first().instance().props.disabled).toBe(true);
    result.find("i.ico-check-box").simulate("click");
    await tickUpdate(result);
    expect(result.find(DateInput).first().instance().props.disabled).toBe(false);
    const dateStart = result.find(DateInput).first().instance();
    dateStart.inputElement.value = "200";
    dateStart.props.onChange("200");
    dateStart.inputElement.value = "20000102";
    dateStart.props.onChange(new Date(moment("20000102")));
    await tickUpdate(result);
    expect(result.state().cfg).toEqual({
      type: "date",
      start: "20000102",
      end: "20000131",
    });
    const dateEnd = result.find(DateInput).last().instance();
    dateEnd.inputElement.value = "20000103";
    dateEnd.props.onChange(new Date(moment("20000103")));
    await tickUpdate(result);
    expect(result.state().cfg).toEqual({
      type: "date",
      start: "20000102",
      end: "20000103",
    });
  });
});
