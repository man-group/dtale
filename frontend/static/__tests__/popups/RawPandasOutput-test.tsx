import { act, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { Provider } from 'react-redux';

import { RawPandasOutput } from '../../popups/RawPandasOutput';
import * as GenericRepository from '../../repository/GenericRepository';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML } from '../test-utils';

describe('RawPandasOutput tests', () => {
  let result: Element;
  let fetchJsonSpy: jest.SpyInstance<Promise<unknown>, [string]>;

  const build = async (): Promise<void> => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '', iframe: 'True', xarray: 'True' }, store);
    result = await act(
      () =>
        render(
          <Provider store={store}>
            <RawPandasOutput />
          </Provider>,
          {
            container: document.getElementById('content') ?? undefined,
          },
        ).container,
    );
  };

  beforeEach(() => {
    fetchJsonSpy = jest.spyOn(GenericRepository, 'getDataFromService');
    fetchJsonSpy.mockImplementation(async (url: string): Promise<unknown> => {
      const urlParams = Object.fromEntries(new URLSearchParams(url.split('?')[1]));
      if (url.startsWith('/dtale/raw-pandas')) {
        return Promise.resolve({ success: true, output: `test ${urlParams.func_type}` });
      }
      return Promise.resolve(undefined);
    });
  });

  afterEach(jest.restoreAllMocks);

  it('RawPandasOutput render', async () => {
    await build();
    expect(result.getElementsByTagName('pre')[0].textContent).toBe('test info');
    await act(async () => {
      fireEvent.click(screen.getByText('df.nunique()'));
    });
    expect(result.getElementsByTagName('pre')[0].textContent).toBe('test nunique');
  });

  it('RawPandasOutput zoom', async () => {
    await build();
    await act(async () => {
      fireEvent.click(result.getElementsByClassName('fa-magnifying-glass-plus')[0]);
    });
    expect((result.getElementsByTagName('pre')[0].style as any)['font-size']).toBe('12px');
    await act(async () => {
      fireEvent.click(result.getElementsByClassName('fa-magnifying-glass-minus')[0]);
    });
    expect((result.getElementsByTagName('pre')[0].style as any)['font-size']).toBe('11px');
  });

  it('RawPandasOutput error test', async () => {
    fetchJsonSpy.mockImplementation(async (url: string): Promise<unknown> => {
      if (url.startsWith('/dtale/raw-pandas')) {
        return Promise.resolve({ success: false, error: 'error test' });
      }
      return Promise.resolve(undefined);
    });
    await build();
    expect(screen.getByRole('alert').textContent).toBe('error test');
  });
});
