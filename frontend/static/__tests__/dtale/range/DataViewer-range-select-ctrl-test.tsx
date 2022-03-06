import axios from 'axios';
import { mount } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';

import { DataViewer } from '../../../dtale/DataViewer';
import GridEventHandler from '../../../dtale/GridEventHandler';
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

  it('DataViewer: row ctrl selection', async () => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    let result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      {
        attachTo: document.getElementById('content') ?? undefined,
      },
    );
    await act(async () => await tickUpdate(result));
    result = result.update();
    await act(async () => {
      result
        .find(GridEventHandler)
        .find('div.main-panel-content')
        .props()
        .onClick?.({
          target: { attributes: { cell_idx: { nodeValue: '0|1' } } },
          ctrlKey: true,
        } as any as React.MouseEvent);
    });
    result = result.update();
    expect(store.getState().ctrlRows).toEqual([1]);
    await act(async () => {
      result
        .find(GridEventHandler)
        .find('div.main-panel-content')
        .props()
        .onClick?.({
          target: { attributes: { cell_idx: { nodeValue: '0|2' } } },
          ctrlKey: true,
        } as any as React.MouseEvent);
    });
    result = result.update();
    expect(store.getState().ctrlRows).toEqual([1, 2]);
    await act(async () => {
      result
        .find(GridEventHandler)
        .find('div.main-panel-content')
        .props()
        .onClick?.({
          target: { attributes: { cell_idx: { nodeValue: '0|1' } } },
          ctrlKey: true,
        } as any as React.MouseEvent);
    });
    result = result.update();
    expect(store.getState().ctrlRows).toEqual([2]);
  });
});
