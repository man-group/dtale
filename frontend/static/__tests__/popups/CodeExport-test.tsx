import { act, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { Provider } from 'react-redux';

import { CodeExport } from '../../popups/CodeExport';
import * as GenericRepository from '../../repository/GenericRepository';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML } from '../test-utils';

describe('CodeExport tests', () => {
  let result: Element;
  let fetchJsonSpy: jest.SpyInstance<Promise<unknown>, [string]>;

  const build = async (): Promise<void> => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '', iframe: 'True', xarray: 'True' }, store);
    result = await act(
      () =>
        render(
          <Provider store={store}>
            <CodeExport />
          </Provider>,
          {
            container: document.getElementById('content') ?? undefined,
          },
        ).container,
    );
  };

  beforeAll(() => {
    Object.defineProperty(global.document, 'queryCommandSupported', {
      value: () => true,
    });
    Object.defineProperty(global.document, 'execCommand', { value: () => undefined });
  });

  beforeEach(() => {
    fetchJsonSpy = jest.spyOn(GenericRepository, 'getDataFromService');
    fetchJsonSpy.mockImplementation(async (url: string): Promise<unknown> => {
      if (url.startsWith('/dtale/code-export')) {
        return Promise.resolve({ success: true, code: 'test code' });
      }
      return Promise.resolve(undefined);
    });
  });

  afterEach(jest.restoreAllMocks);

  it('CodeExport render & copy test', async () => {
    await build();
    expect(result.getElementsByClassName('code-popup-modal')[0].textContent).toBe('test code');
    await act(async () => {
      await fireEvent.click(screen.getByText('Copy'));
    });
  });

  it('CodeExport error test', async () => {
    fetchJsonSpy.mockImplementation(async (url: string): Promise<unknown> => {
      if (url.startsWith('/dtale/code-export')) {
        return Promise.resolve({ success: false, error: 'error test' });
      }
      return Promise.resolve(undefined);
    });
    await build();
    expect(screen.getByRole('alert').textContent).toBe('error test');
  });
});
