import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { MaxDimensionOption, MaxWidthOption } from '../../../dtale/menu/MaxDimensionOption';
import * as serverState from '../../../dtale/serverStateManagement';
import { StyledSlider } from '../../../sliderUtils';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML } from '../../test-utils';

describe('MaxWidthOption tests', () => {
  let result: ReactWrapper;
  let store: Store;
  let udpateMaxColumnWidthSpy: jest.SpyInstance;

  const setupOption = (maxColumnWidth?: string): void => {
    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '', maxColumnWidth }, store);
    result = mount(
      <Provider store={store}>
        <MaxWidthOption />,
      </Provider>,
      {
        attachTo: document.getElementById('content') ?? undefined,
      },
    );
  };

  beforeEach(() => {
    udpateMaxColumnWidthSpy = jest.spyOn(serverState, 'updateMaxColumnWidth');
    udpateMaxColumnWidthSpy.mockResolvedValue(Promise.resolve({ success: true }));
    setupOption();
  });

  afterEach(jest.restoreAllMocks);

  it('renders successfully with defaults', () => {
    expect(result.find('i.ico-check-box-outline-blank')).toHaveLength(1);
  });

  it('renders successfully with specified value', () => {
    setupOption('55');
    expect(result.find('i.ico-check-box')).toHaveLength(1);
    expect(result.find('input').props().value).toBe('55');
  });

  it('handles changes to text input', async () => {
    await act(async () => {
      result.find('input').simulate('change', { target: { value: 'f150' } });
    });
    result = result.update();
    expect(result.find(MaxDimensionOption).find('input').props().value).toBe('100');
    await act(async () => {
      result.find('input').simulate('change', { target: { value: '150' } });
    });
    result = result.update();
    expect(result.find(MaxDimensionOption).find('input').props().value).toBe('150');
    await act(async () => {
      result.find('input').simulate('keyDown', { key: 'Enter' });
    });
    result = result.update();
    expect(udpateMaxColumnWidthSpy).toBeCalledTimes(1);
    expect(store.getState().maxColumnWidth).toBe(150);
  });

  it('handles changes to slider', async () => {
    await act(async () => {
      result.find(StyledSlider).props().onAfterChange(150);
    });
    result = result.update();
    expect(result.find(MaxDimensionOption).find('input').props().value).toBe('150');
    expect(udpateMaxColumnWidthSpy).toBeCalledTimes(1);
    expect(store.getState().maxColumnWidth).toBe(150);
  });

  it('handles changes to checkbox', async () => {
    await act(async () => {
      result.find('i.ico-check-box-outline-blank').simulate('click');
    });
    result = result.update();
    expect(result.find(MaxDimensionOption).find('input').props().value).toBe('100');
    expect(udpateMaxColumnWidthSpy).toBeCalledTimes(1);
    expect(store.getState().maxColumnWidth).toBe(100);
    await act(async () => {
      result.find('i.ico-check-box').simulate('click');
    });
    result = result.update();
    expect(udpateMaxColumnWidthSpy).toBeCalledTimes(2);
    expect(udpateMaxColumnWidthSpy.mock.calls[1][0]).toBe(undefined);
    expect(store.getState().maxColumnWidth).toBe(null);
  });
});
