import { mount, shallow } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import serverState from "../../../dtale/serverStateManagement";
import * as fetcher from "../../../fetcher";
import DtypesGrid from "../../../popups/describe/DtypesGrid";
import { MockComponent } from "../../MockComponent";
import reduxUtils from "../../redux-test-utils";
import { tick } from "../../test-utils";

describe("DescribePanel", () => {
  let wrapper, props, fetchJsonSpy, DescribePanel;

  beforeAll(() => {
    jest.mock("../../../dtale/side/SidePanelButtons", () => ({
      SidePanelButtons: MockComponent,
    }));
  });

  beforeEach(async () => {
    fetchJsonSpy = jest.spyOn(fetcher, "fetchJson");
    props = {
      dataId: "1",
      visible: false,
      hideSidePanel: jest.fn(),
      toggleVisible: jest.fn(),
    };
    DescribePanel = require("../../../dtale/side/DescribePanel").ReactDescribePanel;
    wrapper = shallow(<DescribePanel {...props} />);
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

    it("handles changing column", async () => {
      wrapper.setProps({ column: "col2" });
      await tick();
      expect(wrapper.state().selected).toEqual(reduxUtils.DTYPES.dtypes[1]);
    });

    it("handles dtype loading error gracefully", async () => {
      fetchJsonSpy.mockImplementation((_url, callback) => {
        callback({ error: "dtype error", success: false });
      });
      wrapper = shallow(<DescribePanel {...props} />);
      wrapper.setProps({ visible: true, view: "describe", column: "col1" });
      await tick();
      expect(wrapper.state().error).toBeDefined();
    });
  });

  describe(" loading show/hide columns", () => {
    let serverStateSpy, reactWrapper;

    beforeEach(async () => {
      fetchJsonSpy.mockImplementation((_url, callback) => {
        callback({ ...reduxUtils.DTYPES, success: true });
      });
      serverStateSpy = jest.spyOn(serverState, "updateVisibility");
      serverStateSpy.mockImplementation(() => undefined);
      reactWrapper = mount(<DescribePanel {...props} />);
      reactWrapper.setProps({ visible: true, view: "show_hide" });
      await tick();
      reactWrapper.setState({ loadingDtypes: false });
    });

    it("renders successfully", () => {
      expect(reactWrapper.find(DtypesGrid)).toHaveLength(1);
    });

    it("updates visibility correctly", () => {
      reactWrapper.find("button").first().simulate("click");
      expect(serverStateSpy.mock.calls[0][0]).toBe("1");
      expect(serverStateSpy.mock.calls[0][1]).toEqual({
        col1: true,
        col2: true,
        col3: true,
        col4: true,
      });
      serverStateSpy.mock.calls[0][2]();
      expect(props.toggleVisible).toHaveBeenCalledWith({
        col1: true,
        col2: true,
        col3: true,
        col4: true,
      });
    });
  });
});
