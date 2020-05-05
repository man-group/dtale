import _ from "lodash";

import { expect, it } from "@jest/globals";

import mockPopsicle from "./MockPopsicle";
import { tick } from "./test-utils";

describe("fetcher tests", () => {
  beforeAll(() => {
    jest.mock("popsicle", () =>
      mockPopsicle.mock(() => {
        throw "Exception test!";
      })
    );
  });

  it("fetcher: testing exceptions", async () => {
    const { fetchJson } = require("../fetcher");
    const errors = [];
    global.console = {
      log: global.console.log,
      error: error => errors.push(error),
    };
    fetchJson("url", _.noop);
    await tick();
    expect(errors.length).toBe(3);
  });
});
