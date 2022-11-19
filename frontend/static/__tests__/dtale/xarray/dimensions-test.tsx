import { act, fireEvent, render } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';
import selectEvent from 'react-select-event';
import { Store } from 'redux';

import { DataViewer } from '../../../dtale/DataViewer';
import DimensionsHelper from '../../DimensionsHelper';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, clickMainMenuButton, mockChartJS, selectOption } from '../../test-utils';

describe('DataViewer tests', () => {
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 775,
  });
  let store: Store;

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();
  });

  beforeEach(async () => {
    (axios.get as any).mockImplementation((url: string) => {
      if (url.startsWith('/dtale/xarray-coordinates/1')) {
        return Promise.resolve({
          data: {
            data: [
              { name: 'foo', count: 10, dtype: 'object' },
              { name: 'bar', count: 5, dtype: 'float64' },
            ],
          },
        });
      } else if (url.startsWith('/dtale/xarray-dimension-values/1/foo')) {
        return Promise.resolve({
          data: { data: [{ value: 'foo1' }, { value: 'foo2' }, { value: 'foo3' }] },
        });
      } else if (url.startsWith('/dtale/xarray-dimension-values/1/bar')) {
        return Promise.resolve({
          data: { data: [{ value: 'bar1' }, { value: 'bar2' }, { value: 'bar3' }] },
        });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });

    store = reduxUtils.createDtaleStore();
    const xarrayDim = '{&quot;foo&quot;:&quot;foo1&quot;}';
    buildInnerHTML({ settings: '', xarray: 'True', xarrayDim }, store);
    await act(async () => {
      render(
        <Provider store={store}>
          <DataViewer />
        </Provider>,
        { container: document.getElementById('content') ?? undefined },
      );
    });
    await clickMainMenuButton('XArray Dimensions');
  });

  afterEach(jest.restoreAllMocks);

  afterAll(() => {
    dimensions.afterAll();
    jest.restoreAllMocks();
  });

  it('DataViewer: update selected dimensions of xarray', async () => {
    const select = document.body
      .getElementsByClassName('modal-body')[0]
      .getElementsByClassName('Select')[0] as HTMLElement;
    await act(async () => {
      await selectEvent.openMenu(select);
    });
    expect(select.getElementsByClassName('Select__option--is-selected')[0].textContent).toEqual('foo1');
    await act(async () => {
      await selectEvent.select(select, 'foo2');
    });
    const liElements = document.body.getElementsByClassName('modal-body')[0].getElementsByTagName('li');
    const lastLi = liElements[liElements.length - 1];
    await act(async () => {
      fireEvent.click(lastLi);
    });
    await selectOption(lastLi.getElementsByClassName('Select')[0] as HTMLElement, 'bar2');
    await act(async () => {
      fireEvent.click(document.body.getElementsByClassName('modal-footer')[0].getElementsByTagName('button')[0]);
    });
    expect(store.getState().xarrayDim).toEqual({ foo: 'foo2', bar: 'bar2' });
  });

  it('DataViewer: clearing selected dimensions', async () => {
    const select = document.body
      .getElementsByClassName('modal-body')[0]
      .getElementsByClassName('Select')[0] as HTMLElement;
    await act(async () => {
      await selectEvent.clearFirst(select);
    });
    await act(async () => {
      fireEvent.click(document.body.getElementsByClassName('modal-footer')[0].getElementsByTagName('button')[0]);
    });
    expect(store.getState().xarrayDim).toEqual({});
  });
});
