import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import CorrelationsOption from "../../../dtale/menu/CorrelationsOption";
import GageRnROption from "../../../dtale/menu/GageRnROption";
import { LanguageOption } from "../../../dtale/menu/LanguageOption";
import MergeOption from "../../../dtale/menu/MergeOption";
import MissingOption from "../../../dtale/menu/MissingOption";
import { PPSOption } from "../../../dtale/menu/PPSOption";
import { PredefinedFiltersOption } from "../../../dtale/menu/PredefinedFiltersOption";
import ShowHideColumnsOption from "../../../dtale/menu/ShowHideColumnsOption";
import serverState from "../../../dtale/serverStateManagement";
import reduxUtils from "../../redux-test-utils";
import { buildInnerHTML, PREDEFINED_FILTERS, tickUpdate } from "../../test-utils";

describe("DataViewerMenu tests", () => {
  const { open } = window;
  let DataViewerMenu, store, updateLanguageSpy;

  beforeAll(() => {
    delete window.open;
    window.open = jest.fn();
  });

  beforeEach(() => {
    updateLanguageSpy = jest.spyOn(serverState, "updateLanguage");
    updateLanguageSpy.mockImplementation((_language, callback) => callback());
    DataViewerMenu = require("../../../dtale/menu/DataViewerMenu").DataViewerMenu;
    store = reduxUtils.createDtaleStore();
  });

  afterAll(() => {
    window.open = open;
    jest.restoreAllMocks();
  });

  const buildMenu = (hiddenProps, props) => {
    buildInnerHTML({ settings: "", ...hiddenProps }, store);
    const finalProps = {
      openChart: _.noop,
      propagateState: _.noop,
      menuOpen: true,
      selectedCols: [],
      sortInfo: [],
      columns: [],
      iframe: false,
      dataId: "1",
      ...props,
    };
    return mount(
      <Provider store={store}>
        <DataViewerMenu {...finalProps} />
      </Provider>,
      {
        attachTo: document.getElementById("content"),
      }
    );
  };

  it("DataViewerMenu: render", () => {
    const result = buildMenu({}, {});
    expect(result.find("ul li span.toggler-action").last().text()).toBe("Shutdown");
  });

  it("DataViewerMenu: hide_shutdown == True", () => {
    const result = buildMenu({ hideShutdown: "True" });
    expect(
      result
        .find("ul li span.toggler-action")
        .findWhere(b => _.includes(b.text(), "Instances"))
        .first()
        .text()
    ).toBe("Instances 1");
  });

  it("DataViewerMenu: processes == 2", () => {
    const result = buildMenu({ hideShutdown: "True", processes: 2 });
    expect(
      result
        .find("ul li span.toggler-action")
        .findWhere(b => _.includes(b.text(), "Instances"))
        .first()
        .text()
    ).toBe("Instances 2");
  });

  it("opens side panel", () => {
    const result = buildMenu({}, { predefinedFilters: PREDEFINED_FILTERS });
    result.find(MissingOption).props().open();
    expect(store.getState().sidePanel.view).toBe("missingno");
    result.find(GageRnROption).props().open();
    expect(store.getState().sidePanel.view).toBe("gage_rnr");
    result.find(CorrelationsOption).props().open();
    expect(store.getState().sidePanel.view).toBe("correlations");
    result.find(PPSOption).props().open();
    expect(store.getState().sidePanel.view).toBe("pps");
    result.find(ShowHideColumnsOption).props().open();
    expect(store.getState().sidePanel.view).toBe("show_hide");
    result.find(PredefinedFiltersOption).props().open();
    expect(store.getState().sidePanel.view).toBe("predefined_filters");
  });

  it("calls window.open", () => {
    const result = buildMenu({});
    result.find(MergeOption).props().open();
    expect(window.open).toHaveBeenCalledWith("/dtale/popup/merge", "_blank");
  });

  it("udpates languages", async () => {
    const result = buildMenu({});
    result.find(LanguageOption).find("button").last().simulate("click");
    await tickUpdate(result);
    expect(updateLanguageSpy.mock.calls[0][0]).toBe("cn");
    expect(store.getState().language).toBe("cn");
  });
});
