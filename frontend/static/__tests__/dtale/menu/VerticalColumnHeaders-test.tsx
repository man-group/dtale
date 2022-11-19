import { act, fireEvent, render } from '@testing-library/react';
import * as React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import VerticalColumnHeaders from '../../../dtale/menu/VerticalColumnHeaders';
import * as serverState from '../../../dtale/serverStateManagement';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML } from '../../test-utils';

describe('VerticalColumnHeaders tests', () => {
  let result: Element;
  let store: Store;
  let updateSettingsSpy: jest.SpyInstance;

  const setupOption = async (settings = ''): Promise<void> => {
    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings }, store);
    result = await act(() => {
      return render(
        <Provider store={store}>
          <VerticalColumnHeaders />,
        </Provider>,
        {
          container: document.getElementById('content') ?? undefined,
        },
      ).container;
    });
  };

  beforeEach(() => {
    updateSettingsSpy = jest.spyOn(serverState, 'updateSettings');
    updateSettingsSpy.mockImplementation(() => undefined);
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('renders successfully with defaults', async () => {
    await setupOption();
    expect(result.getElementsByClassName('ico-check-box-outline-blank')).toHaveLength(1);
  });

  it('renders successfully with specified value', async () => {
    await setupOption('{&quot;verticalHeaders&quot;:&quot;True&quot;}');
    expect(result.getElementsByClassName('ico-check-box')).toHaveLength(1);
  });

  it('handles changes to checkbox', async () => {
    await setupOption();
    await act(async () => {
      await fireEvent.click(result.getElementsByClassName('ico-check-box-outline-blank')[0]);
    });
    expect(updateSettingsSpy).toBeCalledTimes(1);
    expect(store.getState().settings).toEqual(expect.objectContaining({ verticalHeaders: true }));
    await act(async () => {
      await fireEvent.click(result.getElementsByClassName('ico-check-box')[0]);
    });
    expect(updateSettingsSpy).toBeCalledTimes(2);
    expect(updateSettingsSpy.mock.calls[1][0]).toEqual({
      verticalHeaders: false,
    });
    expect(store.getState().settings).toEqual(expect.objectContaining({ verticalHeaders: false }));
  });
});
