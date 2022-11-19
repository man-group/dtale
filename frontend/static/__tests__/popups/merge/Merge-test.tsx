import { act, fireEvent, getByTestId, getByText, render, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

jest.mock('../../../dtale/DataViewer', () => {
  const { createMockComponent } = require('../../mocks/createMockComponent');
  return {
    DataViewer: createMockComponent(),
  };
});

import MergeDatasets from '../../../popups/merge/MergeDatasets';
import * as mergeActions from '../../../redux/actions/merge';
import * as GenericRepository from '../../../repository/GenericRepository';
import * as UploadRepository from '../../../repository/UploadRepository';
import { PROCESSES, default as reduxUtils } from '../../redux-test-utils';
import { buildInnerHTML } from '../../test-utils';

describe('MergeDatasets', () => {
  const { close, location, open, opener } = window;
  let store: Store;
  let postSpy: jest.SpyInstance;
  let webUploadSpy: jest.SpyInstance;

  beforeEach(async () => {
    delete (window as any).location;
    delete (window as any).close;
    delete (window as any).open;
    delete window.opener;
    (window as any).location = {
      reload: jest.fn(),
      pathname: '/dtale/merge',
      href: '',
      assign: jest.fn(),
    };
    window.close = jest.fn();
    window.open = jest.fn();
    window.opener = { location: { assign: jest.fn(), pathname: '/dtale/merge' } };
    webUploadSpy = jest.spyOn(UploadRepository, 'webUpload');
    webUploadSpy.mockResolvedValue({ success: true, data_id: '2' });
    (axios.get as any).mockImplementation(async (url: string) => {
      if (url.startsWith('/dtale/processes')) {
        const data = PROCESSES.map((p) => ({
          ...p,
          names: p.names.split(',').map((c) => ({
            name: c,
            dtype: 'int',
          })),
        }));
        return Promise.resolve({ data: { data, success: true } });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    postSpy = jest.spyOn(GenericRepository, 'postDataToService');
    postSpy.mockResolvedValue(Promise.resolve({ success: true, data_id: '1' }));
    store = reduxUtils.createMergeStore();
    buildInnerHTML({ settings: '' });
    await mergeActions.init(store.dispatch);
    await act(
      async () =>
        await render(
          <Provider store={store}>
            <MergeDatasets />
          </Provider>,
          {
            container: document.getElementById('content') ?? undefined,
          },
        ).container,
    );
  });

  afterEach(jest.resetAllMocks);

  afterAll(() => {
    jest.restoreAllMocks();
    window.location = location;
    window.close = close;
    window.open = open;
    window.opener = opener;
  });

  const mergeOutput = (): HTMLElement => screen.getByTestId('merge-output');
  const actionConfig = (): HTMLElement => screen.getByTestId('action-config');
  const clickDatasetBtn = async (dataId = '8080'): Promise<void> => {
    await act(async () => {
      await fireEvent.click(screen.getByText(dataId));
    });
  };
  const buildMerge = async (actionType: string): Promise<void> => {
    await act(async () => {
      await fireEvent.click(screen.getByText(`Build ${actionType}`));
    });
  };
  const clickBtn = async (btnText: string, selectedWrapper: HTMLElement): Promise<void> => {
    await act(async () => {
      await fireEvent.click(getByText(selectedWrapper, btnText));
    });
  };

  it('handles merge', async () => {
    expect(store.getState().instances).toHaveLength(4);
    await clickDatasetBtn();
    await clickDatasetBtn();
    expect(store.getState().datasets).toHaveLength(2);
    await act(async () => {
      await fireEvent.change(mergeOutput().getElementsByTagName('input')[0], { target: { value: 'test_merge' } });
    });
    await buildMerge('Merge');
    expect(postSpy).toHaveBeenCalled();
    expect(postSpy.mock.calls[0][1]).toEqual({
      action: 'merge',
      config: `{"how":"inner","sort":false,"indicator":false}`,
      datasets:
        `[{"columns":[],"index":[],"dataId":"8080","suffix":null},` +
        `{"columns":[],"index":[],"dataId":"8080","suffix":null}]`,
      name: 'test_merge',
    });
    expect(getByText(mergeOutput(), 'Clear Data & Keep Editing')).toBeDefined();
    await clickBtn('Clear Data & Keep Editing', mergeOutput());
    expect(store.getState().mergeDataId).toBeNull();
  });

  it('handles merge error', async () => {
    expect(store.getState().instances).toHaveLength(4);
    await clickDatasetBtn();
    await clickDatasetBtn();
    expect(store.getState().datasets).toHaveLength(2);
    postSpy.mockResolvedValue(Promise.resolve({ success: false, error: 'Bad Merge' }));
    await buildMerge('Merge');
    expect(postSpy).toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toBe('Bad Merge');
    await act(async () => {
      await fireEvent.click(screen.getByRole('alert').querySelector('.ico-cancel')!);
    });
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
  });

  it('handles stack', async () => {
    await act(async () => {
      await fireEvent.click(getByText(actionConfig(), 'Stack'));
    });
    await act(async () => {
      await fireEvent.click(actionConfig().querySelector('i.ico-check-box-outline-blank')!);
    });
    await clickDatasetBtn('8081 - foo');
    await clickDatasetBtn('8081 - foo');
    expect(store.getState().datasets).toHaveLength(2);
    await act(async () => {
      await fireEvent.change(mergeOutput().getElementsByTagName('input')[0], { target: { value: 'test_stack' } });
    });
    await buildMerge('Stack');
    expect(postSpy).toHaveBeenCalled();
    expect(postSpy.mock.calls[0][1]).toEqual({
      action: 'stack',
      config: `{"ignoreIndex":true}`,
      datasets:
        `[{"columns":[],"index":[],"dataId":"8081","suffix":null},` +
        `{"columns":[],"index":[],"dataId":"8081","suffix":null}]`,
      name: 'test_stack',
    });
  });

  it('handles upload', async () => {
    await act(async () => {
      await fireEvent.click(screen.getByText('Upload'));
    });
    expect(getByTestId(document.body, 'upload')).toBeDefined();
    const mFile = new File(['test'], 'test.csv');
    await act(async () => {
      const inputEl = getByTestId(document.body, 'drop-input');
      Object.defineProperty(inputEl, 'files', { value: [mFile] });
      await fireEvent.drop(inputEl);
    });
    await act(async () => {
      await fireEvent.click(getByTestId(document.body, 'csv-options-load'));
    });
    expect(axios.get).toHaveBeenLastCalledWith('/dtale/processes?dtypes=true');
  });

  it('handles dataset removal datasets', async () => {
    expect(store.getState().instances).toHaveLength(4);
    await clickDatasetBtn();
    await clickDatasetBtn();
    await clickBtn('Remove Dataset', screen.getByText('Dataset 1').parentElement!);
    await act(async () => {
      await fireEvent.click(screen.getByText('Dataset 1'));
    });
    await act(async () => {
      await fireEvent.click(screen.getByText('Data'));
    });
    expect(store.getState().datasets).toEqual([
      {
        dataId: '8080',
        index: [],
        columns: [],
        suffix: null,
        isOpen: false,
        isDataOpen: true,
      },
    ]);
  });
});
