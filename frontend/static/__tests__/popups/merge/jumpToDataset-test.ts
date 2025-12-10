import * as windowUtils from '../../../location';

describe('jumpToDataset', () => {
  const { close, opener } = window;

  beforeEach(() => {
    delete window.opener;
    delete (window as any).close;
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    window.opener = opener;
    window.close = close;
    jest.resetAllMocks();
  });

  it('correctly handles upload in modal', () => {
    const assignSpy = jest.fn();
    jest
      .spyOn(windowUtils, 'getLocation')
      .mockReturnValue({ assign: assignSpy, pathname: '/dtale/popup/upload', origin: 'foo' } as any);
    window.opener = null;
    const { jumpToDataset } = require('../../../popups/upload/uploadUtils');
    jumpToDataset('1', () => ({}));
    expect(assignSpy).toHaveBeenLastCalledWith('foo');
  });

  it('correctly handles upload in new tab', () => {
    jest
      .spyOn(windowUtils, 'getLocation')
      .mockReturnValue({ assign: jest.fn(), pathname: '/dtale/popup/upload', origin: 'foo' } as any);
    window.opener = { location: {} };
    const assignSpy = jest.fn();
    jest
      .spyOn(windowUtils, 'getOpenerLocation')
      .mockReturnValue({ assign: assignSpy, pathname: '/dtale/popup/upload', href: 'http://localhost' } as any);
    window.close = jest.fn();
    const { jumpToDataset } = require('../../../popups/upload/uploadUtils');
    jumpToDataset('1', () => ({}));
    expect(assignSpy).toHaveBeenLastCalledWith('http://1');
    expect(window.close).toHaveBeenCalled();
  });

  it('correctly handles upload in new tab from merge', () => {
    jest
      .spyOn(windowUtils, 'getLocation')
      .mockReturnValue({ assign: jest.fn(), pathname: '/dtale/popup/upload', origin: 'foo' } as any);
    window.opener = { location: {} };
    const assignSpy = jest.fn();
    jest
      .spyOn(windowUtils, 'getOpenerLocation')
      .mockReturnValue({ assign: assignSpy, pathname: '/dtale/popup/merge', href: 'http://localhost' } as any);
    window.close = jest.fn();
    const { jumpToDataset } = require('../../../popups/upload/uploadUtils');
    jumpToDataset('1', () => ({}));
    expect(assignSpy).toHaveBeenLastCalledWith('/dtale/popup/merge');
    expect(window.close).toHaveBeenCalled();
  });

  it('correctly handles merge in new tab', () => {
    const assignSpy = jest.fn();
    jest
      .spyOn(windowUtils, 'getLocation')
      .mockReturnValue({ assign: assignSpy, pathname: '/dtale/popup/merge', origin: 'foo' } as any);
    window.opener = { location: {} };
    jest
      .spyOn(windowUtils, 'getOpenerLocation')
      .mockReturnValue({ assign: jest.fn(), pathname: '/dtale/popup/merge', href: 'http://localhost' } as any);
    window.close = jest.fn();
    const { jumpToDataset } = require('../../../popups/upload/uploadUtils');
    jumpToDataset('1', () => ({}), true);
    expect(assignSpy).toHaveBeenLastCalledWith('http://1');
    expect(window.close).not.toHaveBeenCalled();
  });

  it('correctly handles upload modal from merge', () => {
    jest
      .spyOn(windowUtils, 'getLocation')
      .mockReturnValue({ assign: jest.fn(), pathname: '/dtale/popup/merge', origin: 'foo' } as any);
    window.close = jest.fn();
    const { jumpToDataset } = require('../../../popups/upload/uploadUtils');
    const mergeRefresher = jest.fn();
    jumpToDataset('1', mergeRefresher);
    expect(mergeRefresher).toHaveBeenCalled();
    expect(window.close).not.toHaveBeenCalled();
  });

  it('correctly handles default case', () => {
    const assignSpy = jest.fn();
    jest
      .spyOn(windowUtils, 'getLocation')
      .mockReturnValue({ assign: assignSpy, pathname: '/dtale/popup/foo', href: 'http://localhost' } as any);
    const { jumpToDataset } = require('../../../popups/upload/uploadUtils');
    jumpToDataset('1', () => ({}));
    expect(assignSpy).toHaveBeenLastCalledWith('http://1');
  });

  it('correctly handles arcticdb in startup', () => {
    const assignSpy = jest.fn();
    jest
      .spyOn(windowUtils, 'getLocation')
      .mockReturnValue({ assign: assignSpy, pathname: '/dtale/popup/arcticdb', origin: 'foo' } as any);
    window.close = jest.fn();
    const { jumpToDataset } = require('../../../popups/upload/uploadUtils');
    jumpToDataset('1', () => ({}), true);
    expect(assignSpy).toHaveBeenLastCalledWith('foo');
    expect(window.close).not.toHaveBeenCalled();
  });

  it('correctly handles arcticdb in popup', () => {
    jest
      .spyOn(windowUtils, 'getLocation')
      .mockReturnValue({ assign: jest.fn(), pathname: '/dtale/popup/arcticdb', origin: 'foo' } as any);
    window.opener = { location: {} };
    const assignSpy = jest.fn();
    jest
      .spyOn(windowUtils, 'getOpenerLocation')
      .mockReturnValue({ assign: assignSpy, pathname: '/dtale/popup/arcticdb', href: 'http://localhost' } as any);
    window.close = jest.fn();
    const { jumpToDataset } = require('../../../popups/upload/uploadUtils');
    jumpToDataset('1', () => ({}), true);
    expect(assignSpy).toHaveBeenLastCalledWith('http://1');
    expect(window.close).toHaveBeenCalled();
  });
});
