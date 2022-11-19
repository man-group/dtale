import { act, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';

jest.mock('../../popups/merge/DataPreview', () => {
  const { createMockComponent } = require('../mocks/createMockComponent');
  return { DataPreview: createMockComponent('DataPreview', () => <div data-testid="data-preview" />) };
});

import Instances from '../../popups/instances/Instances';
import * as GenericRepository from '../../repository/GenericRepository';
import * as InstanceRepository from '../../repository/InstanceRepository';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML } from '../test-utils';

describe('Instances tests', () => {
  const assignSpy = jest.fn();
  const { location } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });
  let cleanupInstanceSpy: jest.SpyInstance<Promise<GenericRepository.BaseResponse | undefined>, [string]>;

  beforeAll(() => {
    dimensions.beforeAll();

    delete (window as any).location;
    (window as any).location = {
      href: 'http://localhost:8080',
      hostname: 'localhost',
      port: '8080',
      origin: 'http://localhost:8080',
      assign: assignSpy,
      pathname: '/dtale/main/1',
    };
  });

  beforeEach(() => {
    (axios.get as any).mockImplementation(async (url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
    cleanupInstanceSpy = jest.spyOn(InstanceRepository, 'cleanupInstance');
  });

  afterEach(jest.restoreAllMocks);

  afterAll(() => {
    dimensions.afterAll();
    assignSpy.mockRestore();
    window.location = location;
  });

  const buildResult = async (overrides?: Record<string, string>): Promise<Element> => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ dataId: '8080', iframe: 'False', settings: '', ...overrides }, store);
    return await act(
      () =>
        render(
          <Provider store={store}>
            <Instances />
          </Provider>,
          {
            container: document.getElementById('content') ?? undefined,
          },
        ).container,
    );
  };

  it('Instances rendering data', async () => {
    const result = await buildResult();
    const previewButtons = Array.from(result.getElementsByClassName('preview-btn'));
    await act(async () => {
      await fireEvent.click(previewButtons[previewButtons.length - 1]);
    });
    const previewHeader = result.querySelector('h4.preview-header')!;
    expect(previewHeader.textContent).toBe('8083 (2018-04-30 12:36:44)Preview');
    await act(async () => {
      await fireEvent.click(previewButtons[0]);
    });
    expect(previewHeader.textContent).toBe('8081 - foo (2018-04-30 12:36:44)Preview');
    expect(screen.getByTestId('data-preview')).toBeDefined();
    await act(async () => {
      const clickable = Array.from(result.querySelectorAll('div.clickable'));
      await fireEvent.click(clickable[clickable.length - 1]);
    });
    expect(assignSpy).toHaveBeenCalledWith('http://localhost:8080/dtale/main/8083');
    await act(async () => {
      await fireEvent.click(result.getElementsByClassName('ico-delete')[0]);
    });
    expect(cleanupInstanceSpy).toHaveBeenCalledWith('8081');
  });

  it('Instances rendering error', async () => {
    (axios.get as any).mockImplementation(async (url: string) => {
      if (url === '/dtale/processes') {
        return Promise.resolve({ data: { error: 'Error Test' } });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    await buildResult({ dataId: '8082' });
    expect(screen.getByRole('alert').textContent).toBe('Error Test');
  });
});
