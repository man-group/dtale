import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { DataViewer, ReactDataViewer } from '../../../dtale/DataViewer';
import { ReactGridCell as GridCell } from '../../../dtale/GridCell';
import { ReactGridEventHandler } from '../../../dtale/GridEventHandler';
import { CopyRangeToClipboard } from '../../../popups/CopyRangeToClipboard';
import DimensionsHelper from '../../DimensionsHelper';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, mockChartJS, tickUpdate } from '../../test-utils';

describe('DataViewer tests', () => {
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 775,
  });

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
    await tickUpdate(result);
    return result;
  };

  it('DataViewer: range selection', async () => {
    let result = await build();
    let cellIdx = result.find(GridCell).at(20).find('div').prop('cell_idx');
    const instance = result.find(ReactGridEventHandler).instance() as typeof ReactGridEventHandler.prototype;
    instance.handleClicks({
      target: { attributes: { cell_idx: { nodeValue: cellIdx } } },
      shiftKey: true,
    });
    cellIdx = result.find(GridCell).last().find('div').prop('cell_idx');
    await act(async () => {
      instance.handleMouseOver({
        target: { attributes: { cell_idx: { nodeValue: cellIdx } } },
        shiftKey: true,
      });
      instance.handleClicks({
        target: { attributes: { cell_idx: { nodeValue: cellIdx } } },
        shiftKey: true,
      });
    });
    result = result.update();
    expect(result.find(ReactDataViewer).instance().state.rangeSelect).toEqual({
      start: '3|3',
      end: '4|5',
    });
    const copyRange = result.find(CopyRangeToClipboard).first();
    expect(store.getState().chartData.text).toBe('foo\t2000-01-01\nfoo\t\nfoo\t\n');
    await act(async () => {
      copyRange.find('i.ico-check-box-outline-blank').simulate('click');
    });
    result = result.update();
    expect(copyRange.find('pre').text()).toBe('col3\tcol4\nfoo\t2000-01-01\nfoo\t\nfoo\t\n');
    await act(async () => {
      copyRange.find('button').first().simulate('click');
    });
    result = result.update();
    expect(result.find(ReactDataViewer).instance().state.rangeSelect).toBeNull();
  });
});
