import { mount } from "enzyme";
import React from "react";
import Select from "react-select";

import { MockComponent } from "../../MockComponent";

describe("MergeDatasets", () => {
  let result;

  beforeEach(() => {
    jest.mock("../../../dtale/DataViewer", () => ({
      DataViewer: MockComponent,
      ReactDataViewer: MockComponent,
    }));
    jest.mock("../../../popups/merge/ActionConfig", () => MockComponent);
    jest.mock("../../../popups/merge/MergeOutput", () => MockComponent);
    jest.mock("../../../popups/Popup", () => ({
      Popup: MockComponent,
    }));
    const { ReactMergeDatasets } = require("../../../popups/merge/MergeDatasets");
    const props = {
      instances: [{ data_id: "1", names: [{ name: "foo", dtype: "int" }] }],
      loading: false,
      loadingDatasets: false,
      action: "merge",
      datasets: [
        {
          dataId: "1",
          index: null,
          columns: null,
          suffix: null,
          isOpen: true,
          isDataOpen: false,
        },
      ],
      addDataset: jest.fn(),
      removeDataset: jest.fn(),
      toggleDataset: jest.fn(),
      updateDataset: jest.fn(),
      openChart: jest.fn(),
      loadingError: null,
      mergeError: null,
      loadDatasets: jest.fn(),
    };
    result = mount(<ReactMergeDatasets {...props} />);
  });

  it("triggers dataset functions", () => {
    result.find("dt").first().simulate("click");
    expect(result.props().toggleDataset).toHaveBeenLastCalledWith(0);
    result.find(Select).first().props().onChange(null);
    expect(result.props().updateDataset).toHaveBeenLastCalledWith(0, "index", null);
    result.find(Select).last().props().onChange(null);
    expect(result.props().updateDataset).toHaveBeenLastCalledWith(0, "columns", null);
    result
      .find("input")
      .last()
      .simulate("change", { target: { value: "suffix" } });
    expect(result.props().updateDataset).toHaveBeenLastCalledWith(0, "suffix", "suffix");
    result
      .find("button")
      .findWhere(b => b.text() === "Remove Dataset")
      .first()
      .simulate("click");
    expect(result.props().removeDataset).toHaveBeenLastCalledWith(0);
    result.find("dt").last().simulate("click");
    expect(result.props().updateDataset).toHaveBeenLastCalledWith(0, "isDataOpen", true);
  });
});
