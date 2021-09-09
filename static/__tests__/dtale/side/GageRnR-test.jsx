import { mount, shallow } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import { ReactGageRnR } from "../../../dtale/side/GageRnR";
import * as fetcher from "../../../fetcher";
import ColumnSelect from "../../../popups/create/ColumnSelect";
import reduxUtils from "../../redux-test-utils";
import { tick, tickUpdate } from "../../test-utils";

const GageData = require("./gage_rnr.json");

describe("Gage R&R", () => {
  let wrapper, props, fetchJsonSpy;

  beforeEach(async () => {
    fetchJsonSpy = jest.spyOn(fetcher, "fetchJson");
    fetchJsonSpy.mockImplementation((url, callback) => {
      if (url.startsWith("/dtale/dtypes")) {
        callback({ ...reduxUtils.DTYPES, success: true });
      } else {
        callback({ ...GageData });
      }
    });
    props = {
      dataId: "1",
      hideSidePanel: jest.fn(),
      settings: {},
    };
    wrapper = mount(<ReactGageRnR {...props} />);
    await tick();
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(jest.restoreAllMocks);

  it("renders successfully", async () => {
    expect(wrapper.find(ColumnSelect)).toHaveLength(2);
    wrapper
      .find(ColumnSelect)
      .first()
      .props()
      .updateState({ operator: [{ value: "col1" }] });
    await tickUpdate(wrapper);
    expect(wrapper.state().results).toHaveLength(6);
  });

  it("handles dtype loading error gracefully", async () => {
    fetchJsonSpy.mockImplementation((_url, callback) => {
      callback({ error: "dtype error", success: false });
    });
    wrapper = shallow(<ReactGageRnR {...props} />);
    await tick();
    expect(wrapper.state().error).toBeDefined();
  });
});
