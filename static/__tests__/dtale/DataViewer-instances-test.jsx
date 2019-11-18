import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { ModalClose } from "react-modal-bootstrap";
import { Provider } from "react-redux";

import { DataViewerMenu } from "../../dtale/DataViewerMenu";
import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, withGlobalJquery } from "../test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

describe("DataViewer tests", () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, value: 500 });
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, value: 500 });

    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
  });

  test("DataViewer: instances", done => {
    const { DataViewer } = require("../../dtale/DataViewer");
    const Instances = require("../../popups/Instances").default;

    const store = reduxUtils.createDtaleStore();
    buildInnerHTML("", "True", 2);
    const result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById("content") }
    );

    setTimeout(() => {
      result.update();
      result
        .find(DataViewerMenu)
        .find("ul li button")
        .findWhere(b => _.includes(b.text(), "Instances"))
        .first()
        .simulate("click");
      setTimeout(() => {
        result.update();
        t.equal(result.find(Instances).length, 1, "should show instances");
        result
          .find(ModalClose)
          .first()
          .simulate("click");
        t.equal(result.find(Instances).length, 0, "should hide instances");
        done();
      }, 400);
    }, 600);
  });
});
