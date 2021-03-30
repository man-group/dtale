import _ from "lodash";

import { expect, it } from "@jest/globals";

import mockPopsicle from "./MockPopsicle";
import { buildInnerHTML, withGlobalJquery } from "./test-utils";

jest.mock("../i18n", () => ({}));

describe("main tests", () => {
  const { location, open, top, self, opener } = window;

  beforeEach(() => {
    jest.resetModules();
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("./redux-test-utils").default;
        return urlFetcher(url);
      })
    );

    const mockDateInput = withGlobalJquery(() => require("@blueprintjs/datetime"));
    jest.mock("popsicle", () => mockBuildLibs);
    jest.mock("@blueprintjs/datetime", () => mockDateInput);
  });

  beforeAll(() => {
    delete window.location;
    delete window.open;
    delete window.top;
    delete window.self;
    delete window.opener;
    window.location = { reload: jest.fn(), pathname: "/dtale/iframe/1" };
    window.open = jest.fn();
    window.top = { location: { href: "http://test.com" } };
    window.self = { location: { href: "http://test/dtale/iframe" } };
    window.opener = { code_popup: { code: "test code", title: "Test" } };
  });

  afterAll(() => {
    window.location = location;
    window.open = open;
    window.top = top;
    window.self = self;
    window.opener = opener;
  });

  const testMain = (mainName, search = "", fname = "main") => {
    window.location = { pathname: `/dtale/${mainName}/1`, search };
    buildInnerHTML();

    const ReactDOM = require("react-dom");
    const renderSpy = jest.spyOn(ReactDOM, "render");
    renderSpy.mockImplementation(() => undefined);
    require(`../${fname}`);
    expect(renderSpy).toHaveBeenCalledTimes(1);
  };

  it("base_styles.js loading", () => {
    require("../base_styles");
    return;
  });

  it("polyfills.js loading", () => {
    const mockES6Promise = { polyfill: _.noop };
    jest.mock("es6-promise", () => mockES6Promise);
    jest.mock("string.prototype.startswith", () => ({}));
    require("../polyfills");
  });

  it("main rendering", () => testMain("main"));

  it("network main rendering", () => testMain("network/1", "", "network/main"));

  it("correlations_popup_main rendering", () => {
    window.location = { pathname: "/dtale/popup/correlations/1" };
    testMain("popup/correlations");
  });

  const popupCodes = _.concat(
    ["correlations", "charts", "describe", "column-analysis", "instances", "code-export", "filter", "type-conversion"],
    ["cleaners", "upload", "merge", "pps", "variance", "build", "duplicates", "replacement", "reshape"]
  );

  _.forEach(popupCodes, popup => {
    it(`${popup} popup rendering`, () => {
      testMain(`popup/${popup}`);
    });
  });

  it("code snippet rendering", () => {
    testMain("code-popup");
  });

  it("code snippet without parent rendering", () => {
    window.opener = null;
    testMain("code-popup");
  });
});
