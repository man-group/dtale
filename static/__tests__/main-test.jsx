import _ from "lodash";

import mockPopsicle from "./MockPopsicle";
import * as t from "./jest-assertions";
import { buildInnerHTML, withGlobalJquery } from "./test-utils";

function testMain(mainName, search = "") {
  window.location = { pathname: `/dtale/${mainName}/1`, search };
  buildInnerHTML();
  const mockReactDOM = { renderStatus: false };
  mockReactDOM.render = () => {
    mockReactDOM.renderStatus = true;
  };
  withGlobalJquery(() => jest.mock("react-dom", () => mockReactDOM));
  require(`../main`);
  t.ok(mockReactDOM.renderStatus, `${mainName} compiled`);
}

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

    jest.mock("popsicle", () => mockBuildLibs);
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

  test("main rendering", done => {
    testMain("main");
    done();
  });

  test("base_styles.js loading", () => {
    require("../base_styles");
    t.ok(true, "base_styles.js loaded");
  });

  test("polyfills.js loading", () => {
    const mockES6Promise = { polyfill: _.noop };
    jest.mock("es6-promise", () => mockES6Promise);
    jest.mock("string.prototype.startswith", () => ({}));
    require("../polyfills");
    t.ok(true, "polyfills.js loaded");
  });

  test("correlations_popup_main rendering", done => {
    window.location = { pathname: "/dtale/popup/correlations/1" };
    testMain("popup/correlations");
    done();
  });

  _.forEach(["correlations", "charts", "describe", "histogram", "instances", "code"], popup => {
    test(`${popup} popup rendering`, done => {
      testMain(`popup/${popup}`);
      done();
    });
  });

  test("code snippet rendering", done => {
    testMain("code-popup");
    done();
  });
});
