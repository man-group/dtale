import { shallow } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import { ReactMissingNoCharts } from "../../../dtale/side/MissingNoCharts";
import * as fetcher from "../../../fetcher";
import reduxUtils from "../../redux-test-utils";
import { tick } from "../../test-utils";

describe("MissingNoCharts", () => {
  let wrapper, props, fetchJsonSpy;

  beforeEach(async () => {
    fetchJsonSpy = jest.spyOn(fetcher, "fetchJson");
    fetchJsonSpy.mockImplementation((_url, callback) => {
      callback({ ...reduxUtils.DTYPES, success: true });
    });
    props = {
      dataId: "1",
      hideSidePanel: jest.fn(),
    };
    wrapper = shallow(<ReactMissingNoCharts {...props} />);
    await tick();
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(() => jest.restoreAllMocks());

  it("renders successfully", () => {
    expect(wrapper.find("img")).toHaveLength(1);
    expect(wrapper.state()).toEqual(
      expect.objectContaining({
        chartType: "matrix",
        freq: { value: "BQ", label: "BQ - BQ" },
        dateCol: null,
        imageLoading: true,
      })
    );
    expect(wrapper.state().dtypes).toHaveLength(4);
    expect(wrapper.state().dateCols).toHaveLength(1);
    expect(wrapper.state().imageUrl.startsWith("/dtale/missingno/matrix/1?date_index=&freq=BQ")).toBeTruthy();
    expect(wrapper.state().fileUrl.startsWith("/dtale/missingno/matrix/1?date_index=&freq=BQ&file=true")).toBeTruthy();
  });

  it("updates URLs on chart prop changes", () => {
    wrapper.setState({ chartType: "heatmap" });
    expect(wrapper.state().imageUrl.startsWith("/dtale/missingno/heatmap/1?date_index=&freq=BQ")).toBeTruthy();
    expect(wrapper.state().fileUrl.startsWith("/dtale/missingno/heatmap/1?date_index=&freq=BQ&file=true")).toBeTruthy();
  });

  it("includes date col & freq in matrix chart", () => {
    wrapper.setState({ dateCol: wrapper.state().dateCols[0] });
    const imageUrl = wrapper.state().imageUrl;
    const imageUrlExpected = "/dtale/missingno/matrix/1?date_index=&freq=BQ";
    expect(imageUrl.startsWith(imageUrlExpected)).toBeTruthy();
  });

  it("image loading updates state", () => {
    wrapper.find("img").props().onLoad();
    expect(wrapper.state().imageLoading).toBe(false);
  });

  it("shows error when image cannot be rendered", () => {
    wrapper.find("img").props().onError();
    expect(wrapper.state().error).toBeDefined();
  });
});
