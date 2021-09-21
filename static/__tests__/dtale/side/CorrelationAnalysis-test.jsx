import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import Table from "react-virtualized/dist/commonjs/Table/Table";

import { expect, it } from "@jest/globals";

import serverState from "../../../dtale/serverStateManagement";
import { ReactCorrelationAnalysis } from "../../../dtale/side/CorrelationAnalysis";
import * as fetcher from "../../../fetcher";
import { StyledSlider } from "../../../sliderUtils";
import DimensionsHelper from "../../DimensionsHelper";
import { tick } from "../../test-utils";

const ANALYSIS = {
  ranks: [
    { column: "foo", score: 0.5, missing: 0 },
    { column: "bar", score: 0.25, missing: 10 },
    { column: "baz", score: null, missing: 5 },
  ],
  corrs: {
    foo: { bar: 0.5, baz: null },
    bar: { foo: 0.15, baz: null },
    baz: { foo: 0.25, bar: 0.25 },
  },
};

describe("CorrelationAnalysis", () => {
  let wrapper, props, fetchJsonSpy, serverStateSpy, deleteColumnsSpy;
  const dimensions = new DimensionsHelper({
    offsetWidth: 1205,
    offsetHeight: 775,
  });

  beforeAll(() => dimensions.beforeAll());

  beforeEach(async () => {
    fetchJsonSpy = jest.spyOn(fetcher, "fetchJson");
    fetchJsonSpy.mockImplementation((_url, callback) => {
      callback({ ...ANALYSIS, success: true });
    });
    serverStateSpy = jest.spyOn(serverState, "deleteColumns");
    deleteColumnsSpy = jest.fn(() => undefined);
    serverStateSpy.mockImplementation(() => deleteColumnsSpy);
    props = {
      dataId: "1",
      hideSidePanel: jest.fn(),
      openChart: jest.fn(),
      dropColumns: jest.fn(),
    };
    wrapper = mount(<ReactCorrelationAnalysis {...props} />);
    await tick();
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(() => {
    jest.restoreAllMocks();
    dimensions.afterAll();
  });

  it("renders successfully", () => {
    expect(wrapper.find(Table)).toHaveLength(1);
    expect(wrapper.state().selections).toBeDefined();
    expect(_.sum(_.map(wrapper.state().data, "corrs"))).toBe(0);
  });

  it("handles sorts", () => {
    wrapper.find("div.headerCell.pointer").first().simulate("click");
    expect(wrapper.state().currSort).toEqual(["column", "ASC"]);
    wrapper.find("div.headerCell.pointer").first().simulate("click");
    expect(wrapper.state().currSort).toEqual(["column", "DESC"]);
    wrapper.find("div.headerCell.pointer").last().simulate("click");
    expect(wrapper.state().currSort).toEqual(["missing", "ASC"]);
  });

  it("handles deselection of columns", async () => {
    wrapper.find("i.ico-check-box").first().simulate("click");
    expect(wrapper.state().selections.foo).toBe(false);
    expect(wrapper.find("i.ico-check-box-outline-blank")).toHaveLength(1);
    expect(wrapper.find("button.btn-primary")).toHaveLength(1);
    wrapper.find("button.btn-primary").first().simulate("click");
    expect(props.openChart).toHaveBeenCalled();
    props.openChart.mock.calls[0][0].yesAction();
    expect(serverStateSpy).toHaveBeenCalledWith(props.dataId, ["foo"]);
    expect(deleteColumnsSpy).toHaveBeenCalled();
    expect(props.dropColumns).toHaveBeenCalledWith(["foo"]);
    expect(props.hideSidePanel).toHaveBeenCalled();
  });

  it("handles threshold updates", () => {
    wrapper.find(StyledSlider).props().onAfterChange(0.25);
    expect(_.sum(_.map(wrapper.state().data, "corrs"))).toBe(1);
  });
});
