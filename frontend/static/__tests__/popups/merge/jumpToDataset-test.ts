describe('jumpToDataset', () => {
  const { close, location, opener } = window;

  beforeEach(() => {
    delete (window as any).location;
    delete window.opener;
    delete (window as any).close;
  });

  afterEach(() => {
    window.opener = opener;
    window.close = close;
    window.location = location;
  });

  it('correctly handles upload in modal', () => {
    (window as any).location = { assign: jest.fn(), pathname: '/dtale/popup/upload', origin: 'foo' };
    window.opener = null;
    const { jumpToDataset } = require('../../../popups/upload/uploadUtils');
    jumpToDataset('1', () => ({}));
    expect(window.location.assign).toHaveBeenLastCalledWith('foo');
  });

  it('correctly handles upload in new tab', () => {
    (window as any).location = { assign: jest.fn(), pathname: '/dtale/popup/upload', origin: 'foo' };
    window.opener = { location: { assign: jest.fn(), pathname: '/dtale/popup/upload', href: 'http://localhost' } };
    window.close = jest.fn();
    const { jumpToDataset } = require('../../../popups/upload/uploadUtils');
    jumpToDataset('1', () => ({}));
    expect(window.opener.location.assign).toHaveBeenLastCalledWith('http://1');
    expect(window.close).toHaveBeenCalled();
  });

  it('correctly handles upload in new tab from merge', () => {
    (window as any).location = { assign: jest.fn(), pathname: '/dtale/popup/upload', origin: 'foo' };
    window.opener = { location: { assign: jest.fn(), pathname: '/dtale/popup/merge', href: 'http://localhost' } };
    window.close = jest.fn();
    const { jumpToDataset } = require('../../../popups/upload/uploadUtils');
    jumpToDataset('1', () => ({}));
    expect(window.opener.location.assign).toHaveBeenLastCalledWith('/dtale/popup/merge');
    expect(window.close).toHaveBeenCalled();
  });

  it('correctly handles merge in new tab', () => {
    (window as any).location = { assign: jest.fn(), pathname: '/dtale/popup/merge', origin: 'foo' };
    window.opener = { location: { assign: jest.fn(), pathname: '/dtale/popup/merge', href: 'http://localhost' } };
    window.close = jest.fn();
    const { jumpToDataset } = require('../../../popups/upload/uploadUtils');
    jumpToDataset('1', () => ({}), true);
    expect(window.location.assign).toHaveBeenLastCalledWith('http://1');
    expect(window.close).not.toHaveBeenCalled();
  });

  it('correctly handles upload modal from merge', () => {
    (window as any).location = { assign: jest.fn(), pathname: '/dtale/popup/merge', origin: 'foo' };
    window.close = jest.fn();
    const { jumpToDataset } = require('../../../popups/upload/uploadUtils');
    const mergeRefresher = jest.fn();
    jumpToDataset('1', mergeRefresher);
    expect(mergeRefresher).toHaveBeenCalled();
    expect(window.close).not.toHaveBeenCalled();
  });

  it('correctly handles default case', () => {
    (window as any).location = { assign: jest.fn(), pathname: '/dtale/popup/foo', href: 'http://localhost' };
    const { jumpToDataset } = require('../../../popups/upload/uploadUtils');
    jumpToDataset('1', () => ({}));
    expect(window.location.assign).toHaveBeenLastCalledWith('http://1');
  });

  it('correctly handles arcticdb in startup', () => {
    (window as any).location = { assign: jest.fn(), pathname: '/dtale/popup/arcticdb', origin: 'foo' };
    window.close = jest.fn();
    const { jumpToDataset } = require('../../../popups/upload/uploadUtils');
    jumpToDataset('1', () => ({}), true);
    expect(window.location.assign).toHaveBeenLastCalledWith('foo');
    expect(window.close).not.toHaveBeenCalled();
  });

  it('correctly handles arcticdb in popup', () => {
    (window as any).location = { assign: jest.fn(), pathname: '/dtale/popup/arcticdb', origin: 'foo' };
    window.opener = { location: { assign: jest.fn(), pathname: '/dtale/popup/arcticdb', href: 'http://localhost' } };
    window.close = jest.fn();
    const { jumpToDataset } = require('../../../popups/upload/uploadUtils');
    jumpToDataset('1', () => ({}), true);
    expect(window.opener.location.assign).toHaveBeenLastCalledWith('http://1');
    expect(window.close).toHaveBeenCalled();
  });
});
