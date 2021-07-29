import { mount } from "enzyme";
import $ from "jquery";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import * as fetcher from "../../../fetcher";
import mergeApp from "../../../reducers/merge";
import { createStore } from "../../../reducers/store";
import { MockComponent } from "../../MockComponent";
import { PROCESSES } from "../../redux-test-utils";
import { buildInnerHTML, tickUpdate } from "../../test-utils";

describe("DataViewer tests", () => {
  jest.mock("../../../dtale/DataViewer", () => ({
    DataViewer: MockComponent,
    ReactDataViewer: MockComponent,
  }));
  let result, store, fetchJsonSpy, postSpy;

  beforeEach(async () => {
    fetchJsonSpy = jest.spyOn(fetcher, "fetchJson");
    fetchJsonSpy.mockImplementation((url, callback) => {
      const { urlFetcher } = require("../../redux-test-utils").default;
      if (_.startsWith(url, "/dtale/processes")) {
        const data = _.map(PROCESSES, p => ({
          ...p,
          names: _.map(p.names.split(","), c => ({
            name: c,
            dtype: "int",
          })),
        }));
        callback({ data, success: true });
        return;
      } else if (_.startsWith(url, "/dtale/cleanup")) {
        callback({ success: true });
        return;
      }
      callback(urlFetcher(url));
    });
    postSpy = jest.spyOn($, "post");
    postSpy.mockImplementation((_url, _params, callback) => callback({ success: true, data_id: "1" }));
    const MergeDatasets = require("../../../popups/merge/MergeDatasets").default;
    const mergeActions = require("../../../actions/merge").default;
    store = createStore(mergeApp);
    buildInnerHTML({ settings: "" });
    store.dispatch(mergeActions.init());
    result = mount(
      <Provider store={store}>
        <MergeDatasets />
      </Provider>,
      {
        attachTo: document.getElementById("content"),
      }
    );
    await tickUpdate(result);
  });

  afterEach(() => {
    result.unmount();
    jest.resetAllMocks();
  });

  it("MergeDatasets: merge", async () => {
    let mergeDatasets = result.find("ReactMergeDatasets");
    expect(mergeDatasets.instance().props.instances).toHaveLength(4);
    const datasetBtn = mergeDatasets.find("ul").at(2).find("button").at(2);
    datasetBtn.simulate("click");
    datasetBtn.simulate("click");
    mergeDatasets = result.find("ReactMergeDatasets");
    expect(mergeDatasets.instance().props.datasets).toHaveLength(2);
    let mergeOutput = mergeDatasets.find("ReactMergeOutput");
    mergeOutput.find("input").simulate("change", { target: { value: "test_merge" } });
    mergeOutput.find("button").simulate("click");
    await tickUpdate(result);
    result.update();
    expect(postSpy).toHaveBeenCalled();
    expect(postSpy.mock.calls[0][1]).toEqual({
      action: "merge",
      config: `{"how":"inner","sort":false,"indicator":false}`,
      datasets:
        `[{"columns":[],"index":[],"dataId":"8081","suffix":null},` +
        `{"columns":[],"index":[],"dataId":"8081","suffix":null}]`,
      name: "test_merge",
    });
    mergeOutput = mergeDatasets.find("ReactMergeOutput");
    expect(mergeOutput.find("ul").find("li").last().find(".row")).toHaveLength(4);
    mergeOutput.instance().props.clearMerge();
    await tickUpdate(result);
    expect(store.getState().mergeDataId).toBeNull();
  });

  it("MergeDatasets: merge error", async () => {
    let mergeDatasets = result.find("ReactMergeDatasets");
    expect(mergeDatasets.instance().props.instances).toHaveLength(4);
    const datasetBtn = mergeDatasets.find("ul").at(2).find("button").at(2);
    datasetBtn.simulate("click");
    datasetBtn.simulate("click");
    mergeDatasets = result.find("ReactMergeDatasets");
    expect(mergeDatasets.instance().props.datasets).toHaveLength(2);
    postSpy.mockImplementation((_url, _params, callback) => callback({ success: false, error: "Bad Merge" }));
    mergeDatasets.find("ReactMergeOutput").find("button").simulate("click");
    await tickUpdate(result);
    result.update();
    expect(postSpy).toHaveBeenCalled();
    expect(result.find("RemovableError")).toHaveLength(1);
    expect(result.find("RemovableError").props().error).toBe("Bad Merge");
    result.find("RemovableError").props().onRemove();
    result.update();
    expect(result.find("RemovableError")).toHaveLength(0);
  });

  it("MergeDatasets: stack", async () => {
    let mergeDatasets = result.find("ReactMergeDatasets");
    const actionConfig = mergeDatasets.find("ReactActionConfig");
    actionConfig.find("ButtonToggle").first().instance().props.update("stack");
    actionConfig.instance().props.updateActionConfig({
      action: "stack",
      prop: "ignoreIndex",
      value: true,
    });
    const datasetBtn = mergeDatasets.find("ul").at(2).find("button").at(2);
    datasetBtn.simulate("click");
    datasetBtn.simulate("click");
    mergeDatasets = result.find("ReactMergeDatasets");
    expect(mergeDatasets.instance().props.datasets).toHaveLength(2);
    const mergeOutput = mergeDatasets.find("ReactMergeOutput");
    mergeOutput.find("input").simulate("change", { target: { value: "test_stack" } });
    mergeOutput.find("button").simulate("click");
    await tickUpdate(result);
    result.update();
    expect(postSpy).toHaveBeenCalled();
    expect(postSpy.mock.calls[0][1]).toEqual({
      action: "stack",
      config: `{"ignoreIndex":true}`,
      datasets:
        `[{"columns":[],"index":[],"dataId":"8081","suffix":null},` +
        `{"columns":[],"index":[],"dataId":"8081","suffix":null}]`,
      name: "test_stack",
    });
  });

  it("MergeDatasets: upload", async () => {
    const mergeDatasets = result.find("ReactMergeDatasets");
    mergeDatasets.find("ul").at(2).find("button").first().simulate("click");
    result.update();
    expect(result.find("ReactUpload")).toHaveLength(1);
    result.find("ReactUpload").instance().props.mergeRefresher();
    expect(fetchJsonSpy.mock.calls[fetchJsonSpy.mock.calls.length - 1][0]).toBe("/dtale/processes?dtypes=true");
  });

  it("MergeDatasets: remove datasets", async () => {
    let mergeDatasets = result.find("ReactMergeDatasets");
    expect(mergeDatasets.instance().props.instances).toHaveLength(4);
    const datasetBtn = mergeDatasets.find("ul").at(2).find("button").at(2);
    datasetBtn.simulate("click");
    datasetBtn.simulate("click");
    mergeDatasets = result.find("ReactMergeDatasets");
    mergeDatasets.instance().props.removeDataset(0);
    mergeDatasets.instance().props.toggleDataset(0);
    mergeDatasets.instance().props.updateDataset(0, "isDataOpen", true);
    expect(store.getState().datasets).toEqual([
      {
        dataId: "8081",
        index: null,
        columns: null,
        suffix: null,
        isOpen: false,
        isDataOpen: true,
      },
    ]);
  });
});
