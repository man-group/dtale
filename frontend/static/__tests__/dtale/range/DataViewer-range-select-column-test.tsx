import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { DataViewer, ReactDataViewer } from '../../../dtale/DataViewer';
import { ReactHeader } from '../../../dtale/Header';
import * as fetcher from '../../../fetcher';
import { CopyRangeToClipboard } from '../../../popups/CopyRangeToClipboard';
import DimensionsHelper from '../../DimensionsHelper';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, mockChartJS, tickUpdate } from '../../test-utils';

const TEXT = 'COPIED_TEXT';

describe('DataViewer tests', () => {
  const dimensions = new DimensionsHelper({
    offsetWidth: 1205,
    offsetHeight: 775,
    innerWidth: 1205,
    innerHeight: 775,
  });

  let postSpy: jest.SpyInstance<void, [string, Record<string, any>, (data: Record<string, any>) => void]>;
  const execCommandMock = jest.fn();
  let store: Store;

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();
    Object.defineProperty(global.document, 'execCommand', { value: execCommandMock });
  });

  afterAll(() => {
    dimensions.afterAll();
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    execCommandMock.mockReset();
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
    postSpy = jest.spyOn(fetcher, 'fetchPost');
    postSpy.mockImplementation((_url: string, _params: Record<string, any>, callback: any) => callback(TEXT));
  });

  const build = async (): Promise<ReactWrapper> => {
    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store as any);
    const result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      {
        attachTo: document.getElementById('content') ?? undefined,
      },
    );
    await tickUpdate(result);
    return result;
  };

  it('DataViewer: column range selection', async () => {
    let result = await build();
    let instance = result.find(ReactHeader).at(1);
    await act(async () => {
      instance.find('div.headerCell').find('.text-nowrap').simulate('click', { shiftKey: true });
    });
    result = result.update();
    expect(result.find(ReactDataViewer).instance().state.columnRange).toEqual({
      start: 1,
      end: 1,
    });
    instance = result.find(ReactHeader).at(2);
    await act(async () => {
      (instance.instance() as any).handleMouseOver({
        shiftKey: true,
      });
    });
    result = result.update();
    expect(result.find(ReactDataViewer).instance().state.columnRange).toEqual({
      start: 1,
      end: 2,
    });
    await act(async () => {
      instance.find('div.headerCell').find('.text-nowrap').simulate('click', { shiftKey: true });
    });
    result = result.update();
    expect(result.find(CopyRangeToClipboard)).toHaveLength(1);
    expect(store.getState().chartData.text).toBe(TEXT);
    expect(postSpy).toBeCalledTimes(1);
    expect(postSpy).toBeCalledWith('/dtale/build-column-copy/1', { columns: `["col1","col2"]` }, expect.any(Function));

    await act(async () => {
      result.find(CopyRangeToClipboard).first().find('button').first().simulate('click');
    });
    expect(execCommandMock).toHaveBeenCalledTimes(1);
    result.unmount();
  });

  it('DataViewer: column ctrl selection', async () => {
    let result = await build();
    let instance = result.find(ReactHeader).at(1);
    await act(async () => {
      instance.find('div.headerCell').find('.text-nowrap').simulate('click', { ctrlKey: true });
    });
    result = result.update();
    expect(result.find(ReactDataViewer).instance().state.ctrlCols).toEqual([1]);
    instance = result.find(ReactHeader).at(2);
    await act(async () => {
      instance.find('div.headerCell').find('.text-nowrap').simulate('click', { ctrlKey: true });
    });
    result = result.update();
    expect(result.find(ReactDataViewer).instance().state.ctrlCols).toEqual([1, 2]);
    instance = result.find(ReactHeader).at(1);
    await act(async () => {
      instance.find('div.headerCell').find('.text-nowrap').simulate('click', { ctrlKey: true });
    });
    result = result.update();
    expect(result.find(ReactDataViewer).instance().state.ctrlCols).toEqual([2]);
    result.unmount();
  });
});
