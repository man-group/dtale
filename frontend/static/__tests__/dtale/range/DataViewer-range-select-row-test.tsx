import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { DataViewer } from '../../../dtale/DataViewer';
import GridEventHandler from '../../../dtale/GridEventHandler';
import { CopyRangeToClipboard } from '../../../popups/CopyRangeToClipboard';
import * as CopyRangeRepository from '../../../repository/CopyRangeRepository';
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

  let buildCopyRowsSpy: jest.SpyInstance;
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
    const buildCopyColumnsSpy = jest.spyOn(CopyRangeRepository, 'buildCopyColumns');
    buildCopyColumnsSpy.mockResolvedValue({ text: TEXT, success: true });
    buildCopyRowsSpy = jest.spyOn(CopyRangeRepository, 'buildCopyRows');
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

  it('DataViewer: row range selection', async () => {
    let result = await build();
    await act(async () => {
      result
        .find(GridEventHandler)
        .find('div.main-panel-content')
        .props()
        .onClick?.({
          target: { attributes: { cell_idx: { nodeValue: '0|1' } } },
          shiftKey: true,
        } as any as React.MouseEvent);
    });
    result = result.update();
    expect(store.getState().rowRange).toEqual({
      start: 1,
      end: 1,
    });
    await act(async () => {
      result
        .find(GridEventHandler)
        .find('div.main-panel-content')
        .props()
        .onMouseOver?.({
          target: { attributes: { cell_idx: { nodeValue: '0|2' } } },
          shiftKey: true,
        } as any as React.MouseEvent);
    });
    result = result.update();
    expect(store.getState().rowRange).toEqual({
      start: 1,
      end: 2,
    });
    await act(async () => {
      result
        .find(GridEventHandler)
        .find('div.main-panel-content')
        .props()
        .onClick?.({
          target: { attributes: { cell_idx: { nodeValue: '0|2' } } },
          shiftKey: true,
        } as any as React.MouseEvent);
    });
    result = result.update();
    const copyRange = result.find(CopyRangeToClipboard).first();
    expect(copyRange.find('pre').text()).toBe(TEXT);
    expect(buildCopyRowsSpy).toBeCalledTimes(1);
    expect(buildCopyRowsSpy).toBeCalledWith('1', ['col1', 'col2', 'col3', 'col4'], { start: '1', end: '2' });
  });
});
