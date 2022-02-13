import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { createMockComponent } from '../../mocks/createMockComponent'; // eslint-disable-line import/order
jest.mock('../../../dtale/DataViewer', () => ({
  DataViewer: createMockComponent(),
}));

import ButtonToggle from '../../../ButtonToggle';
import ActionConfig from '../../../popups/merge/ActionConfig';
import MergeDatasets from '../../../popups/merge/MergeDatasets';
import MergeOutput from '../../../popups/merge/MergeOutput';
import Upload from '../../../popups/upload/Upload';
import * as mergeActions from '../../../redux/actions/merge';
import mergeApp from '../../../redux/reducers/merge';
import { MergeConfigType } from '../../../redux/state/MergeState';
import { createAppStore } from '../../../redux/store';
import { RemovableError } from '../../../RemovableError';
import * as GenericRepository from '../../../repository/GenericRepository';
import { PROCESSES, default as reduxUtils } from '../../redux-test-utils';
import { buildInnerHTML, tickUpdate } from '../../test-utils';

describe('MergeDatasets', () => {
  let result: ReactWrapper;
  let store: Store;
  let axiosGetSpy: jest.SpyInstance;
  let postSpy: jest.SpyInstance;

  beforeEach(async () => {
    axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation(async (url: string) => {
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
    store = createAppStore(mergeApp);
    buildInnerHTML({ settings: '' });
    await mergeActions.init(store.dispatch);
    result = mount(
      <Provider store={store}>
        <MergeDatasets />
      </Provider>,
      {
        attachTo: document.getElementById('content') ?? undefined,
      },
    );
    await act(async () => await tickUpdate(result));
    result = result.update();
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  const mergeDatasets = (): ReactWrapper => result.find(MergeDatasets);
  const mergeOutput = (): ReactWrapper => mergeDatasets().find(MergeOutput);
  const actionConfig = (): ReactWrapper => mergeDatasets().find(ActionConfig);
  const clickDatasetBtn = async (): Promise<ReactWrapper> => {
    await act(async () => {
      mergeDatasets().find('ul').at(2).find('button').at(2).simulate('click');
    });
    return result.update();
  };
  const buildMerge = async (): Promise<ReactWrapper> => {
    await act(async () => {
      mergeOutput().find('button').simulate('click');
    });
    return result.update();
  };
  const clickBtn = async (btnText: string, selectedWrapper: ReactWrapper): Promise<ReactWrapper> => {
    await act(async () => {
      selectedWrapper
        .find('button')
        .filterWhere((btn) => btn.text() === btnText)
        .first()
        .simulate('click');
    });
    return result.update();
  };

  it('handles merge', async () => {
    expect(store.getState().instances).toHaveLength(4);
    result = await clickDatasetBtn();
    result = await clickDatasetBtn();
    expect(store.getState().datasets).toHaveLength(2);
    await act(async () => {
      mergeOutput()
        .find('input')
        .simulate('change', { target: { value: 'test_merge' } });
    });
    result = result.update();
    result = await buildMerge();
    expect(postSpy).toHaveBeenCalled();
    expect(postSpy.mock.calls[0][1]).toEqual({
      action: 'merge',
      config: `{"how":"inner","sort":false,"indicator":false}`,
      datasets:
        `[{"columns":[],"index":[],"dataId":"8081","suffix":null},` +
        `{"columns":[],"index":[],"dataId":"8081","suffix":null}]`,
      name: 'test_merge',
    });
    expect(
      mergeOutput()
        .find('button')
        .filterWhere((btn) => btn.text() === 'Clear Data & Keep Editing'),
    ).toHaveLength(1);
    result = await clickBtn('Clear Data & Keep Editing', mergeOutput());
    expect(store.getState().mergeDataId).toBeNull();
  });

  it('handles merge error', async () => {
    expect(store.getState().instances).toHaveLength(4);
    result = await clickDatasetBtn();
    result = await clickDatasetBtn();
    expect(store.getState().datasets).toHaveLength(2);
    postSpy.mockResolvedValue(Promise.resolve({ success: false, error: 'Bad Merge' }));
    result = await buildMerge();
    await tickUpdate(result);
    result.update();
    expect(postSpy).toHaveBeenCalled();
    expect(result.find(RemovableError)).toHaveLength(1);
    expect(result.find(RemovableError).props().error).toBe('Bad Merge');
    result.find(RemovableError).props().onRemove();
    result.update();
    expect(result.find(RemovableError)).toHaveLength(0);
  });

  it('handles stack', async () => {
    await act(async () => {
      actionConfig().find(ButtonToggle).first().props().update(MergeConfigType.STACK);
    });
    result = result.update();
    await act(async () => {
      actionConfig().find('i.ico-check-box-outline-blank').simulate('click');
    });
    result = result.update();
    result = await clickDatasetBtn();
    result = await clickDatasetBtn();
    expect(store.getState().datasets).toHaveLength(2);
    await act(async () => {
      mergeOutput()
        .find('input')
        .simulate('change', { target: { value: 'test_stack' } });
    });
    result = result.update();
    result = await buildMerge();
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
      mergeDatasets().find('ul').at(2).find('button').first().simulate('click');
    });
    result = result.update();
    expect(result.find(Upload)).toHaveLength(1);
    await act(async () => {
      result.find(Upload).props().mergeRefresher();
    });
    result = result.update();
    expect(axiosGetSpy).toHaveBeenLastCalledWith('/dtale/processes?dtypes=true');
  });

  it('handles dataset removal datasets', async () => {
    expect(store.getState().instances).toHaveLength(4);
    result = await clickDatasetBtn();
    result = await clickDatasetBtn();
    result = await clickBtn('Remove Dataset', mergeDatasets());
    await act(async () => {
      mergeDatasets()
        .find('dt')
        .filterWhere((dt) => dt.text().startsWith('Dataset 1'))
        .first()
        .simulate('click');
    });
    result = result.update();
    await act(async () => {
      mergeDatasets()
        .find('dt')
        .filterWhere((dt) => dt.text() === 'Data')
        .first()
        .simulate('click');
    });
    result = result.update();
    expect(store.getState().datasets).toEqual([
      {
        dataId: '8081',
        index: [],
        columns: [],
        suffix: null,
        isOpen: false,
        isDataOpen: true,
      },
    ]);
  });
});
