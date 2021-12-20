import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { DataViewer, ReactDataViewer } from '../../../dtale/DataViewer';
import { ReactGridEventHandler } from '../../../dtale/GridEventHandler';
import * as fetcher from '../../../fetcher';
import { CopyRangeToClipboard } from '../../../popups/CopyRangeToClipboard';
import DimensionsHelper from '../../DimensionsHelper';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, mockChartJS, tickUpdate } from '../../test-utils';

const TEXT = 'COPIED_TEXT';

describe('DataViewer tests', () => {
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
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

  it('DataViewer: row range selection', async () => {
    let result = await build();
    const instance = result.find(ReactGridEventHandler).instance() as typeof ReactGridEventHandler.prototype;
    instance.handleClicks({
      target: { attributes: { cell_idx: { nodeValue: '0|1' } } },
      shiftKey: true,
    });
    expect(result.find(ReactDataViewer).instance().state.rowRange).toEqual({
      start: 1,
      end: 1,
    });
    instance.handleMouseOver({
      target: { attributes: { cell_idx: { nodeValue: '0|2' } } },
      shiftKey: true,
    });
    expect(result.find(ReactDataViewer).instance().state.rowRange).toEqual({
      start: 1,
      end: 2,
    });
    await act(async () => {
      instance.handleClicks({
        target: { attributes: { cell_idx: { nodeValue: '0|2' } } },
        shiftKey: true,
      });
    });
    result = result.update();
    const copyRange = result.find(CopyRangeToClipboard).first();
    expect(copyRange.find('pre').text()).toBe(TEXT);
    expect(postSpy).toBeCalledTimes(1);
    expect(postSpy).toBeCalledWith(
      '/dtale/build-row-copy/1',
      { start: 1, end: 2, columns: `["col1","col2","col3","col4"]` },
      expect.any(Function),
    );
  });
});
