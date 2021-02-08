import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import { MockComponent } from "../../MockComponent";

describe("ActionConfig", () => {
  let result, jumpToDatasetSpy;

  beforeEach(() => {
    jest.mock("../../../popups/merge/DataPreview", () => MockComponent);
    const uploadUtils = require("../../../popups/upload/uploadUtils");
    jumpToDatasetSpy = jest.spyOn(uploadUtils, "jumpToDataset");
    jumpToDatasetSpy.mockImplementation(() => undefined);
    const { ReactMergeOutput } = require("../../../popups/merge/MergeOutput");
    const props = {
      action: "merge",
      mergeConfig: { how: "inner", sort: false, indicator: false },
      stackConfig: { ignoreIndex: false },
      datasets: [
        {
          dataId: "1",
          index: null,
          columns: null,
          suffix: null,
          isOpen: true,
          isDataOpen: false,
        },
        {
          dataId: "1",
          index: null,
          columns: null,
          suffix: null,
          isOpen: true,
          isDataOpen: false,
        },
      ],
      buildMerge: jest.fn(),
      loadingMerge: false,
      mergeDataId: null,
      clearMerge: jest.fn(),
      showCode: false,
      toggleShowCode: jest.fn(),
    };
    result = mount(<ReactMergeOutput {...props} />);
  });

  afterEach(() => jest.restoreAllMocks());

  it("triggers function correctly", () => {
    expect(result.find("h3").text()).toBe("Merge Output");
    result.find("input").simulate("change", { target: { value: "test merge" } });
    expect(result.state().name).toBe("test merge");
    result.find("button").simulate("click");
    expect(result.props().buildMerge).toHaveBeenLastCalledWith("test merge");
  });

  it("triggers built merge functions correctly", () => {
    result.setProps({ mergeDataId: "1" });
    result.find("button").at(1).simulate("click");
    expect(jumpToDatasetSpy).toHaveBeenLastCalledWith("1", _.noop, true);
    result.find("button").last().simulate("click");
    expect(result.props().clearMerge).toHaveBeenCalled();
    expect(result.find(MockComponent).props().dataId).toBe("1");
  });
});
