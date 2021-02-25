import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";

import { describe, expect, it } from "@jest/globals";

import { MenuTooltip } from "../../../dtale/menu/MenuTooltip";
import { ReactXArrayOption as XArrayOption } from "../../../dtale/menu/XArrayOption";
import reduxUtils from "../../redux-test-utils";
import { buildInnerHTML } from "../../test-utils";

describe("XArrayOption tests", () => {
  it("renders selected xarray dimensions", () => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" }, store);
    const result = mount(
      <Provider store={store}>
        <XArrayOption xarray={true} xarrayDim={{ foo: 1 }} />,
        <MenuTooltip />,
      </Provider>,
      {
        attachTo: document.getElementById("content"),
      }
    );
    result.find("li").simulate("mouseover");
    expect(_.endsWith(result.find("div.hoverable__content").text(), "1 (foo)")).toBe(true);
  });
});
