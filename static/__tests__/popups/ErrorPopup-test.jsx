import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";

import { RemovableError } from "../../RemovableError";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML } from "../test-utils";

describe("ErrorPopup", () => {
  let result;
  beforeEach(async () => {
    const Error = require("../../popups/ErrorPopup").Error;
    const store = reduxUtils.createDtaleStore();
    store.getState().chartData = { error: "error test", visible: true };
    buildInnerHTML({ settings: "" }, store);
    result = mount(
      <Provider store={store}>
        <Error />
      </Provider>,
      { attachTo: document.getElementById("content") }
    );
  });

  it("rendering test", () => {
    expect(result.find(RemovableError).prop("error")).toBe("error test");
  });
});
