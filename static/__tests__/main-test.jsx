import _ from "lodash";

import mockPopsicle from "./MockPopsicle";
import * as t from "./jest-assertions";
import { buildInnerHTML, withGlobalJquery } from "./test-utils";

function testMain(mainName, isDev = false) {
  if (isDev) {
    process.env.NODE_ENV = "dev";
  }
  buildInnerHTML();
  const mockReactDOM = { renderStatus: false };
  mockReactDOM.render = () => {
    mockReactDOM.renderStatus = true;
  };
  withGlobalJquery(() => jest.mock("react-dom", () => mockReactDOM));
  require(`../${mainName}`);
  t.ok(mockReactDOM.renderStatus, `${mainName} compiled`);
  if (isDev) {
    process.env.NODE_ENV = "test";
  }
}

describe("main tests", () => {
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

  test("dtale_main rendering", done => {
    testMain("dtale/dtale_main");
    done();
  });

  test("dtalemain dev rendering", done => {
    testMain("dtale/dtale_main", true);
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
});
