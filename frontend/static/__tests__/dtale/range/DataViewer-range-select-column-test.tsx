import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { DataViewer } from '../../../dtale/DataViewer';
import Header from '../../../dtale/Header';
import { CopyRangeToClipboard } from '../../../popups/CopyRangeToClipboard';
import * as CopyRangeRepository from '../../../repository/CopyRangeRepository';
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

  let buildCopyColumnsSpy: jest.SpyInstance;
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
    buildCopyColumnsSpy = jest.spyOn(CopyRangeRepository, 'buildCopyColumns');
    buildCopyColumnsSpy.mockResolvedValue({ text: TEXT, success: true });
    const buildCopyRowsSpy = jest.spyOn(CopyRangeRepository, 'buildCopyRows');
    buildCopyRowsSpy.mockResolvedValue({ text: TEXT, success: true });
  });

  const build = async (): Promise<ReactWrapper> => {
    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    const result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      {
        attachTo: document.getElementById('content') ?? undefined,
      },
    );
    await act(async () => await tickUpdate(result));
    return result.update();
  };

  it('DataViewer: column range selection', async () => {
    let result = await build();
    await act(async () => {
      result.find(Header).at(1).find('div.headerCell').find('.text-nowrap').simulate('click', { shiftKey: true });
    });
    result = result.update();
    expect(store.getState().columnRange).toEqual({
      start: 1,
      end: 1,
    });
    await act(async () => {
      result
        .find(Header)
        .at(2)
        .find('div')
        .first()
        .props()
        .onMouseOver?.({
          shiftKey: true,
        } as any as React.MouseEvent);
    });
    result = result.update();
    expect(store.getState().columnRange).toEqual({
      start: 1,
      end: 2,
    });
    await act(async () => {
      result.find(Header).at(2).find('div.headerCell').find('.text-nowrap').simulate('click', { shiftKey: true });
    });
    result = result.update();
    expect(result.find(CopyRangeToClipboard)).toHaveLength(1);
    expect(store.getState().chartData.text).toBe(TEXT);
    expect(buildCopyColumnsSpy).toBeCalledTimes(1);
    expect(buildCopyColumnsSpy).toBeCalledWith('1', ['col1', 'col2']);

    await act(async () => {
      result.find(CopyRangeToClipboard).first().find('button').first().simulate('click');
    });
    expect(execCommandMock).toHaveBeenCalledTimes(1);
    result.unmount();
  });

  it('DataViewer: column ctrl selection', async () => {
    let result = await build();
    let instance = result.find(Header).at(1);
    await act(async () => {
      instance.find('div.headerCell').find('.text-nowrap').simulate('click', { ctrlKey: true });
    });
    result = result.update();
    expect(store.getState().ctrlCols).toEqual([1]);
    instance = result.find(Header).at(2);
    await act(async () => {
      instance.find('div.headerCell').find('.text-nowrap').simulate('click', { ctrlKey: true });
    });
    result = result.update();
    expect(store.getState().ctrlCols).toEqual([1, 2]);
    instance = result.find(Header).at(1);
    await act(async () => {
      instance.find('div.headerCell').find('.text-nowrap').simulate('click', { ctrlKey: true });
    });
    result = result.update();
    expect(store.getState().ctrlCols).toEqual([2]);
    result.unmount();
  });
});
