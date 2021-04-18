import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import reduxUtils from "../redux-test-utils";

describe("reducer tests", () => {
  it("dtale: missing hidden input", () => {
    const store = reduxUtils.createDtaleStore();
    const body = document.getElementsByTagName("body")[0];
    body.innerHTML = `<div id="content" style="height: 1000px;width: 1000px;" ></div>`;

    mount(<Provider store={store} />, {
      attachTo: document.getElementById("content"),
    });
    const state = {
      chartData: { visible: false },
      hideShutdown: false,
      iframe: false,
      columnMenuOpen: false,
      selectedCol: null,
      dataId: null,
      editedCell: null,
      xarray: false,
      xarrayDim: {},
      allowCellEdits: true,
      theme: "light",
      language: "en",
      filteredRanges: {},
      settings: {},
      pythonVersion: null,
      isPreview: false,
      menuPinned: false,
      menuTooltip: {
        visible: false,
      },
      ribbonDropdown: {
        visible: false,
      },
      ribbonMenuOpen: false,
      sidePanel: {
        visible: false,
      },
      columnsToToggle: null,
    };
    expect(state).toEqual(store.getState());
  });
});
