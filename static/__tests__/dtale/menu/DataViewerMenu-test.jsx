import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import reduxUtils from "../../redux-test-utils";
import { buildInnerHTML } from "../../test-utils";

describe("DataViewerMenu tests", () => {
  let DataViewerMenu;
  let store;

  beforeEach(() => {
    DataViewerMenu = require("../../../dtale/menu/DataViewerMenu").DataViewerMenu;
    store = reduxUtils.createDtaleStore();
  });

  it("DataViewerMenu: render", () => {
    buildInnerHTML({ settings: "" }, store);
    const props = {
      openChart: _.noop,
      propagateState: _.noop,
      menuOpen: true,
      selectedCols: [],
      sortInfo: [],
      columns: [],
      hideShutdown: false,
      iframe: false,
      dataId: "1",
    };
    const result = mount(
      <Provider store={store}>
        <DataViewerMenu {...props} />
      </Provider>,
      {
        attachTo: document.getElementById("content"),
      }
    );
    expect(result.find("ul li span.toggler-action").last().text()).toBe("Shutdown");
  });

  it("DataViewerMenu: hide_shutdown == True", () => {
    buildInnerHTML({ settings: "", hideShutdown: "True" }, store);
    const props = {
      openChart: _.noop,
      propagateState: _.noop,
      menuOpen: true,
      selectedCols: [],
      sortInfo: [],
      columns: [],
      hideShutdown: true,
      iframe: false,
      dataId: "1",
    };
    const result = mount(
      <Provider store={store}>
        <DataViewerMenu {...props} />
      </Provider>,
      {
        attachTo: document.getElementById("content"),
      }
    );
    expect(
      result
        .find("ul li span.toggler-action")
        .findWhere(b => _.includes(b.text(), "Instances"))
        .first()
        .text()
    ).toBe("Instances 1");
  });

  it("DataViewerMenu: processes == 2", () => {
    buildInnerHTML({ settings: "", hideShutdown: "True", processes: 2 }, store);
    const props = {
      openChart: _.noop,
      propagateState: _.noop,
      menuOpen: true,
      selectedCols: [],
      sortInfo: [],
      columns: [],
      hideShutdown: true,
      iframe: false,
      dataId: "1",
    };
    const result = mount(
      <Provider store={store}>
        <DataViewerMenu {...props} />
      </Provider>,
      {
        attachTo: document.getElementById("content"),
      }
    );
    expect(
      result
        .find("ul li span.toggler-action")
        .findWhere(b => _.includes(b.text(), "Instances"))
        .first()
        .text()
    ).toBe("Instances 2");
  });
});
