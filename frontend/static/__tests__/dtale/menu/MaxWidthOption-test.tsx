import { act, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { MaxWidthOption } from '../../../dtale/menu/MaxDimensionOption';
import * as serverState from '../../../dtale/serverStateManagement';
import DimensionsHelper from '../../DimensionsHelper';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, FakeMouseEvent } from '../../test-utils';

describe('MaxWidthOption tests', () => {
  let result: Element;
  let store: Store;
  let udpateMaxColumnWidthSpy: jest.SpyInstance;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  const setupOption = async (maxColumnWidth?: string): Promise<void> => {
    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '', maxColumnWidth }, store);
    result = await act(
      () =>
        render(
          <Provider store={store}>
            <MaxWidthOption />,
          </Provider>,
          {
            container: document.getElementById('content') ?? undefined,
          },
        ).container,
    );
  };

  beforeAll(() => dimensions.beforeAll());

  beforeEach(() => {
    (Element.prototype as any).getBoundingClientRect = jest.fn(() => {
      return {
        width: 0,
        height: 100,
        top: 0,
        left: 0,
        bottom: 0,
        right: 1000,
      };
    });
    udpateMaxColumnWidthSpy = jest.spyOn(serverState, 'updateMaxColumnWidth');
    udpateMaxColumnWidthSpy.mockResolvedValue(Promise.resolve({ success: true }));
  });

  afterEach(jest.restoreAllMocks);

  afterAll(() => dimensions.afterAll());

  it('renders successfully with defaults', async () => {
    await setupOption();
    expect(result.getElementsByClassName('ico-check-box-outline-blank')).toHaveLength(1);
  });

  it('renders successfully with specified value', async () => {
    await setupOption('55');
    expect(result.getElementsByClassName('ico-check-box')).toHaveLength(1);
    expect(result.getElementsByTagName('input')[0].value).toBe('55');
  });

  it('handles changes to text input', async () => {
    await setupOption();
    const input = result.getElementsByTagName('input')[0];
    await act(async () => {
      fireEvent.change(input, { target: { value: 'f150' } });
    });
    expect(input.value).toBe('100');
    await act(async () => {
      fireEvent.change(input, { target: { value: '150' } });
    });
    expect(input.value).toBe('150');
    await act(async () => {
      fireEvent.keyDown(input, { keyCode: 13 });
    });
    expect(udpateMaxColumnWidthSpy).toBeCalledTimes(1);
    expect(store.getState().maxColumnWidth).toBe(150);
  });

  it('handles changes to slider', async () => {
    await setupOption();
    const thumb = screen.getByRole('slider');
    await act(async () => {
      await fireEvent(thumb, new FakeMouseEvent('mousedown', { bubbles: true, pageX: 0, pageY: 0 }));
    });
    await act(async () => {
      await fireEvent(thumb, new FakeMouseEvent('mousemove', { bubbles: true, pageX: 50, pageY: 0 }));
    });
    await act(async () => {
      await fireEvent.mouseUp(thumb);
    });
    expect(result.getElementsByTagName('input')[0].value).toBe('150');
    expect(udpateMaxColumnWidthSpy).toBeCalledTimes(1);
    expect(store.getState().maxColumnWidth).toBe(150);
  });

  it('handles changes to checkbox', async () => {
    await setupOption();
    await act(async () => {
      fireEvent.click(result.getElementsByClassName('ico-check-box-outline-blank')[0]);
    });
    expect(result.getElementsByTagName('input')[0].value).toBe('100');
    expect(udpateMaxColumnWidthSpy).toBeCalledTimes(1);
    expect(store.getState().maxColumnWidth).toBe(100);
    await act(async () => {
      fireEvent.click(result.getElementsByClassName('ico-check-box')[0]);
    });
    expect(udpateMaxColumnWidthSpy).toBeCalledTimes(2);
    expect(udpateMaxColumnWidthSpy.mock.calls[1][0]).toBe(undefined);
    expect(store.getState().maxColumnWidth).toBe(null);
  });
});
