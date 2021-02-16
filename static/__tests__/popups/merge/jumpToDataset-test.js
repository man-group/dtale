import _ from "lodash";

describe("jumpToDataset", () => {
  const { close, location, opener } = window;

  beforeEach(() => {
    delete window.location;
    delete window.opener;
    delete window.close;
  });

  afterEach(() => {
    window.opener = opener;
    window.close = close;
    window.location = location;
  });

  it("correctly handles upload in modal", () => {
    window.location = { assign: jest.fn(), pathname: "/dtale/popup/upload", origin: "foo" };
    window.opener = null;
    const { jumpToDataset } = require("../../../popups/upload/uploadUtils");
    jumpToDataset("1", _.noop);
    expect(window.location.assign).toHaveBeenLastCalledWith("foo");
  });

  it("correctly handles upload in new tab", () => {
    window.location = { assign: jest.fn(), pathname: "/dtale/popup/upload", origin: "foo" };
    window.opener = { location: { assign: jest.fn(), pathname: "/dtale/popup/upload", href: "http://localhost" } };
    window.close = jest.fn();
    const { jumpToDataset } = require("../../../popups/upload/uploadUtils");
    jumpToDataset("1", _.noop);
    expect(window.opener.location.assign).toHaveBeenLastCalledWith("http://1");
    expect(window.close).toHaveBeenCalled();
  });

  it("correctly handles upload in new tab from merge", () => {
    window.location = { assign: jest.fn(), pathname: "/dtale/popup/upload", origin: "foo" };
    window.opener = { location: { assign: jest.fn(), pathname: "/dtale/popup/merge", href: "http://localhost" } };
    window.close = jest.fn();
    const { jumpToDataset } = require("../../../popups/upload/uploadUtils");
    jumpToDataset("1", _.noop);
    expect(window.opener.location.assign).toHaveBeenLastCalledWith("/dtale/popup/merge");
    expect(window.close).toHaveBeenCalled();
  });

  it("correctly handles merge in new tab", () => {
    window.location = { assign: jest.fn(), pathname: "/dtale/popup/merge", origin: "foo" };
    window.opener = { location: { assign: jest.fn(), pathname: "/dtale/popup/merge", href: "http://localhost" } };
    window.close = jest.fn();
    const { jumpToDataset } = require("../../../popups/upload/uploadUtils");
    jumpToDataset("1", _.noop, true);
    expect(window.location.assign).toHaveBeenLastCalledWith("http://1");
    expect(window.close).not.toHaveBeenCalled();
  });

  it("correctly handles upload modal from merge", () => {
    window.location = { assign: jest.fn(), pathname: "/dtale/popup/merge", origin: "foo" };
    window.close = jest.fn();
    const { jumpToDataset } = require("../../../popups/upload/uploadUtils");
    const mergeRefresher = jest.fn();
    jumpToDataset("1", mergeRefresher);
    expect(mergeRefresher).toHaveBeenCalled();
    expect(window.close).not.toHaveBeenCalled();
  });

  it("correctly handles default case", () => {
    window.location = { assign: jest.fn(), pathname: "/dtale/popup/foo", href: "http://localhost" };
    const { jumpToDataset } = require("../../../popups/upload/uploadUtils");
    jumpToDataset("1", _.noop);
    expect(window.location.assign).toHaveBeenLastCalledWith("http://1");
  });
});
