import axios from 'axios';
import { mount } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';

import { DataViewer } from '../../dtale/DataViewer';
import GridCell from '../../dtale/GridCell';
import { GridCellEditor } from '../../dtale/GridCellEditor';
import GridEventHandler from '../../dtale/GridEventHandler';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, mockChartJS, tickUpdate } from '../test-utils';

describe('DataViewer tests', () => {
  const { open } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 1205,
    offsetHeight: 775,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    delete (window as any).open;
    window.open = jest.fn();
    mockChartJS();
  });

  beforeEach(() => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
  });

  afterEach(jest.resetAllMocks);

  afterAll(() => {
    dimensions.afterAll();
    window.open = open;
    jest.restoreAllMocks();
  });

  it('DataViewer: cell editing', async () => {
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
    const cellIdx = result.find(GridCell).last().find('div').prop('cell_idx');
    await act(async () => {
      result
        .find(GridEventHandler)
        .find('div.main-panel-content')
        .props()
        .onClick?.({
          target: { attributes: { cell_idx: { nodeValue: cellIdx } } },
        } as any as React.MouseEvent);
    });
    result = result.update();
    await act(async () => {
      result
        .find(GridEventHandler)
        .find('div.main-panel-content')
        .props()
        .onClick?.({
          target: { attributes: { cell_idx: { nodeValue: cellIdx } } },
        } as any as React.MouseEvent);
    });
    result = result.update();
    await act(async () => {
      result
        .find(GridCellEditor)
        .find('input')
        .props()
        .onKeyDown?.({ key: 'Escape' } as any as React.KeyboardEvent);
    });
    result = result.update();
    await act(async () => {
      result
        .find(GridEventHandler)
        .find('div.main-panel-content')
        .props()
        .onClick?.({
          target: { attributes: { cell_idx: { nodeValue: cellIdx } } },
        } as any as React.MouseEvent);
    });
    result = result.update();
    await act(async () => {
      result
        .find(GridEventHandler)
        .find('div.main-panel-content')
        .props()
        .onClick?.({
          target: { attributes: { cell_idx: { nodeValue: cellIdx } } },
        } as any as React.MouseEvent);
    });
    result = result.update();
    await act(async () => {
      result
        .find(GridCellEditor)
        .find('input')
        .simulate('change', { target: { value: '20000101' } });
    });
    result = result.update();
    await act(async () => {
      result
        .find(GridCellEditor)
        .find('input')
        .props()
        .onKeyDown?.({ key: 'Enter' } as any as React.KeyboardEvent);
    });
    result = result.update();
    expect(result.find(GridCell).last().text()).toBe('20000101');
  });
});
