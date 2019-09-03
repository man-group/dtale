import _ from "lodash";

import mockPopsicle from "./MockPopsicle";
import * as t from "./jest-assertions";

describe("fetcher tests", () => {
  beforeAll(() => {
    jest.mock("popsicle", () =>
      mockPopsicle.mock(() => {
        throw "Exception test!";
      })
    );
  });

  test("fetcher: testing exceptions", done => {
    const { fetchJson } = require("../fetcher");

    const errors = [];
    global.console = { log: global.console.log, error: error => errors.push(error) };

    fetchJson("url", _.noop);
    setTimeout(() => {
      t.ok(errors.length == 3, "should log 3 exception messages");
      done();
    }, 200);
  });
});
