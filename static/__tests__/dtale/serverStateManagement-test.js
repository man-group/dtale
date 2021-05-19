import { expect, it } from "@jest/globals";

import * as fetcher from "../../fetcher";

import serverStateManagement from "../../dtale/serverStateManagement";

describe("serverstateManagement", () => {
  let fetchJsonSpy;
  const callback = () => undefined;

  beforeEach(() => {
    fetchJsonSpy = jest.spyOn(fetcher, "fetchJson");
    fetchJsonSpy.mockImplementation(() => undefined);
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it("updatePinMenu calls right URL", () => {
    serverStateManagement.updatePinMenu(true, callback);
    expect(fetchJsonSpy).toHaveBeenLastCalledWith("/dtale/update-pin-menu?pinned=true", callback);
  });

  it("updateLanguage calls right URL", () => {
    serverStateManagement.updateLanguage("cn", callback);
    expect(fetchJsonSpy).toHaveBeenLastCalledWith("/dtale/update-language?language=cn", callback);
  });

  it("updateMaxColumnWidth calls right URL", () => {
    serverStateManagement.updateMaxColumnWidth(100, callback);
    expect(fetchJsonSpy).toHaveBeenLastCalledWith("/dtale/update-maximum-column-width?width=100", callback);
  });
});
