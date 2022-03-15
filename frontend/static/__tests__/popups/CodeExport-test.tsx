import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';

import { CodeExport } from '../../popups/CodeExport';
import CodePopup from '../../popups/CodePopup';
import { RemovableError } from '../../RemovableError';
import * as GenericRepository from '../../repository/GenericRepository';
import { tickUpdate } from '../test-utils';

describe('CodeExport tests', () => {
  let result: ReactWrapper;
  let fetchJsonSpy: jest.SpyInstance<Promise<unknown>, [string]>;

  const build = async (): Promise<void> => {
    result = mount(<CodeExport />);
    await act(async () => await tickUpdate(result));
    result = result.update();
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
    const useSelectorSpy = jest.spyOn(redux, 'useSelector');
    useSelectorSpy.mockReturnValue('1');
  });

  afterEach(jest.restoreAllMocks);

  it('CodeExport render & copy test', async () => {
    await build();
    expect(result.find(CodePopup).props().code).toBe('test code');
    result.find('button').simulate('click');
  });

  it('CodeExport error test', async () => {
    fetchJsonSpy.mockImplementation(async (url: string): Promise<unknown> => {
      if (url.startsWith('/dtale/code-export')) {
        return Promise.resolve({ success: false, error: 'error test' });
      }
      return Promise.resolve(undefined);
    });
    await build();
    expect(result.find(RemovableError).text()).toBe('error test');
  });
});
