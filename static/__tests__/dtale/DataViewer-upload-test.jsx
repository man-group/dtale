import { mount } from "enzyme";
import $ from "jquery";
import React from "react";
import Modal from "react-bootstrap/Modal";
import Dropzone from "react-dropzone";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import { RemovableError } from "../../RemovableError";
import CSVOptions from "../../popups/upload/CSVOptions";
import DimensionsHelper from "../DimensionsHelper";
import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";

import { buildInnerHTML, clickMainMenuButton, mockChartJS, tick, tickUpdate, withGlobalJquery } from "../test-utils";

describe("DataViewer tests", () => {
  const { close, location, open, opener } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });
  let result, DataViewer, Upload;
  let readAsDataURLSpy, btoaSpy, ajaxSpy;

  beforeAll(() => {
    dimensions.beforeAll();
    delete window.location;
    delete window.close;
    delete window.open;
    delete window.opener;
    window.location = {
      reload: jest.fn(),
      pathname: "/dtale/column/1",
      assign: jest.fn(),
    };
    window.close = jest.fn();
    window.open = jest.fn();
    window.opener = { location: { assign: jest.fn() } };

    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);
    mockChartJS();

    DataViewer = require("../../dtale/DataViewer").DataViewer;
    Upload = require("../../popups/upload/Upload").ReactUpload;
  });

  beforeEach(async () => {
    readAsDataURLSpy = jest.spyOn(FileReader.prototype, "readAsDataURL");
    btoaSpy = jest.spyOn(window, "btoa");
    ajaxSpy = jest.spyOn($, "ajax");
    ajaxSpy.mockImplementation(({ success }) => success({ data_id: "2" }));
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById("content") }
    );
    await tick();
    clickMainMenuButton(result, "Load Data");
    await tickUpdate(result);
  });

  afterEach(() => {
    result.unmount();
    readAsDataURLSpy.mockRestore();
    btoaSpy.mockRestore();
    ajaxSpy.mockRestore();
  });

  afterAll(() => {
    dimensions.afterAll();
    window.location = location;
    window.close = close;
    window.open = open;
    window.opener = opener;
  });

  const upload = () => result.find(Upload).first();

  it("DataViewer: upload open/close", async () => {
    expect(result.find(Upload).length).toBe(1);
    result.find(Modal.Header).first().find("button").simulate("click");
    expect(result.find(Upload).length).toBe(0);
  });

  it("DataViewer: upload", async () => {
    const mFile = new File(["test"], "test.csv");
    const uploadModal = upload();
    const dd = uploadModal.find(Dropzone);
    dd.props().onDrop([mFile]);
    await tickUpdate(result);
    await tickUpdate(result);

    expect(result.find(CSVOptions).props().show).toBe(true);
    result.find(CSVOptions).find("button").last().simulate("click");
    await tickUpdate(result);

    expect(ajaxSpy).toHaveBeenCalledTimes(1);
    const ajaxCalls = ajaxSpy.mock.calls;
    const firstPostCall = ajaxCalls[0][0];
    expect(firstPostCall.url).toBe("/dtale/upload");
    const read = new FileReader();
    read.readAsBinaryString(firstPostCall.data.entries().next().value[1]);
    read.onloadend = function () {
      expect(read.result).toBe("data:application/octet-stream;base64,dGVzdA==");
    };
    expect(firstPostCall.data.entries().next().value[0]).toBe("test.csv");
    expect(window.location.assign).toBeCalledWith("/2");

    firstPostCall.success({ error: "error test" });
    result.update();
    expect(result.find(RemovableError)).toHaveLength(1);
    await tick();
  });

  it("DataViewer: upload window", async () => {
    window.location.pathname = "/dtale/popup/upload";
    const mFile = new File(["test"], "test.csv");
    const uploadModal = upload();
    const dd = uploadModal.find(Dropzone);
    dd.props().onDrop([mFile]);
    await tickUpdate(result);
    await tickUpdate(result);
    result.find(CSVOptions).find("i.ico-check-box").simulate("click");
    result.find(CSVOptions).find("button").at(4).simulate("click");
    result
      .find(CSVOptions)
      .find("input")
      .simulate("change", { target: { value: "=" } });
    result.find(CSVOptions).find("button").last().simulate("click");
    await tickUpdate(result);

    expect(ajaxSpy).toHaveBeenCalledTimes(1);
    const ajaxCalls = ajaxSpy.mock.calls;
    const firstPostCall = ajaxCalls[0][0];
    expect(firstPostCall.data.get("header")).toBe("false");
    expect(firstPostCall.data.get("separatorType")).toBe("custom");
    expect(firstPostCall.data.get("separator")).toBe("=");
    expect(window.close).toBeCalledTimes(1);
    expect(window.opener.location.assign).toBeCalledWith("/2");
    await tick();
  });

  it("DataViewer: cancel CSV upload", async () => {
    window.location.pathname = "/dtale/popup/upload";
    const mFile = new File(["test"], "test.csv");
    const uploadModal = upload();
    const dd = uploadModal.find(Dropzone);
    dd.props().onDrop([mFile]);
    await tickUpdate(result);
    await tickUpdate(result);
    result.find(CSVOptions).find("button").at(5).simulate("click");
    await tickUpdate(result);

    expect(ajaxSpy).not.toHaveBeenCalled();
    expect(result.find(CSVOptions).props().show).toBe(false);
    await tick();
  });
});
