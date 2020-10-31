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
      selectedToggle: null,
      dataId: null,
      editedCell: null,
      xarray: false,
      xarrayDim: {},
      allowCellEdits: true,
      darkMode: false,
    };
    expect(state).toEqual(store.getState());
  });
});
