import _ from "lodash";
import * as popsicle from "popsicle";

import { expect, it } from "@jest/globals";

import { tick } from "./test-utils";

describe("fetcher tests", () => {
  let consoleErrorSpy, fetchSpy;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(global.console, "error");
    consoleErrorSpy.mockImplementation(() => undefined);
    fetchSpy = jest.spyOn(popsicle, "fetch");
    fetchSpy.mockImplementation(async () => {
      throw "Exception Test";
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    fetchSpy.mockRestore();
  });

  it("fetcher: testing exceptions", async () => {
    const { fetchJson } = require("../fetcher");
    fetchJson("url", _.noop);
    await tick();
    expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
  });
});
