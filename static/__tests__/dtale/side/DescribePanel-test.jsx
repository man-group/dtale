import { mount, shallow } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import { ReactDescribePanel } from "../../../dtale/side/DescribePanel";
import * as fetcher from "../../../fetcher";
import { Details } from "../../../popups/describe/Details";
import reduxUtils from "../../redux-test-utils";
import { tick } from "../../test-utils";

describe("DescribePanel", () => {
  let wrapper, props, fetchJsonSpy;

  beforeEach(async () => {
    fetchJsonSpy = jest.spyOn(fetcher, "fetchJson");
    props = {
      dataId: "1",
      visible: false,
      hideSidePanel: jest.fn(),
    };
    wrapper = shallow(<ReactDescribePanel {...props} />);
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(() => jest.restoreAllMocks());

  it("renders successfully", () => {
    expect(wrapper.html()).toBe(null);
    expect(wrapper.state()).toEqual({ loadingDtypes: true, dtypeLoad: null });
  });

  describe(" loading details", () => {
    const { open } = window;

    beforeAll(() => {
      delete window.open;
      window.open = jest.fn();
    });

    beforeEach(async () => {
      fetchJsonSpy.mockImplementation((_url, callback) => {
        callback({ ...reduxUtils.DTYPES, success: true });
      });
      wrapper.setProps({ visible: true, view: "describe", column: "col1" });
      await tick();
    });

    afterAll(() => (window.open = open));

    it("loads details", () => {
      expect(fetchJsonSpy).toHaveBeenCalledTimes(1);
      expect(wrapper.state().selected).toEqual(reduxUtils.DTYPES.dtypes[0]);
    });

    it("add close/tab functions", () => {
      const details = wrapper.find(Details);
      const close = mount(details.props().close);
      close.find("button").first().simulate("click");
      expect(props.hideSidePanel).toBeCalledTimes(1);
      expect(window.open).toHaveBeenCalledWith("/dtale/popup/describe/1?selectedCol=col1", "_blank");
      close.find("button").last().simulate("click");
      expect(props.hideSidePanel).toBeCalledTimes(2);
    });

    it("handles changing column", async () => {
      wrapper.setProps({ column: "col2" });
      await tick();
      expect(wrapper.state().selected).toEqual(reduxUtils.DTYPES.dtypes[1]);
    });
  });
});
