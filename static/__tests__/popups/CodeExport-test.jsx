import { mount } from "enzyme";
import _ from "lodash";
import React from "react";

import { RemovableError } from "../../RemovableError";
import mockPopsicle from "../MockPopsicle";
import * as t from "../jest-assertions";
import { buildInnerHTML, withGlobalJquery } from "../test-utils";

describe("CodeExport tests", () => {
  beforeAll(() => {
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        if (_.startsWith(url, "/dtale/code-export/1")) {
          return { success: true, code: "test code" };
        }
        if (_.startsWith(url, "/dtale/code-export/2")) {
          return { success: false, error: "error test" };
        }
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);
  });

  test("CodeExport test", done => {
    const { CodeExport } = withGlobalJquery(() => require("../../popups/CodeExport"));
    buildInnerHTML();

    const result = mount(<CodeExport dataId="1" />, {
      attachTo: document.getElementById("content"),
    });
    setTimeout(() => {
      result.update();
      t.equal(result.find("pre").text(), "test code");
      done();
    }, 400);
  });

  test("CodeExport copy test", done => {
    const { CodeExport } = withGlobalJquery(() => require("../../popups/CodeExport"));
    buildInnerHTML();
    Object.defineProperty(global.document, "queryCommandSupported", {
      value: () => true,
    });
    Object.defineProperty(global.document, "execCommand", { value: _.noop });

    const result = mount(<CodeExport dataId="1" />, {
      attachTo: document.getElementById("content"),
    });
    setTimeout(() => {
      result.update();
      result.find("button").simulate("click");
      done();
    }, 400);
  });

  test("CodeExport error test", done => {
    const { CodeExport } = withGlobalJquery(() => require("../../popups/CodeExport"));
    buildInnerHTML();

    const result = mount(<CodeExport dataId="2" />, {
      attachTo: document.getElementById("content"),
    });
    setTimeout(() => {
      result.update();
      t.equal(result.find(RemovableError).text(), "error test");
      done();
    }, 400);
  });
});
