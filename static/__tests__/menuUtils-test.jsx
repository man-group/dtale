import * as t from "./jest-assertions";

describe("menuUtils tests", () => {
  beforeAll(() => {
    jest.mock("jquery", () => {
      const jqueryCfg = {
        closest: () => ({
          is: () => false,
          has: () => [],
        }),
        bindings: {},
      };
      jqueryCfg.bind = (namespace, func) => (jqueryCfg.bindings[namespace] = func);
      jqueryCfg.unbind = namespace => delete jqueryCfg.bindings[namespace];
      return () => jqueryCfg;
    });
  });

  test("fetcher: testing exceptions", done => {
    const { openMenu } = require("../menuUtils").default;
    const $ = require("jquery");

    let closed = false,
      opened = false;
    const open = () => (opened = true);
    const close = () => (closed = true);
    const opener = openMenu("test", open, close);
    opener({ target: "test_target" });
    $().bindings["click.test"]({ target: "test_target2" });
    t.ok(opened && closed, "should open & close menu");
    done();
  });
});
