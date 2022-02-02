import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { default as Select } from 'react-select';
import { Store } from 'redux';

import { DataViewer } from '../../../dtale/DataViewer';
import XArrayDimensions from '../../../popups/XArrayDimensions';
import DimensionsHelper from '../../DimensionsHelper';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, clickMainMenuButton, mockChartJS } from '../../test-utils';

describe('DataViewer tests', () => {
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 775,
  });
  let result: ReactWrapper;
  let store: Store;

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();
  });

  beforeEach(async () => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => {
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
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById('content') ?? undefined },
    );
    // await tickUpdate(result);
    result = await clickMainMenuButton(result, 'XArray Dimensions');
  });

  afterEach(jest.restoreAllMocks);

  afterAll(() => {
    dimensions.afterAll();
    jest.restoreAllMocks();
  });

  it('DataViewer: update selected dimensions of xarray', async () => {
    expect(result.find(XArrayDimensions).find(Select).first().props().options[0]).toEqual({
      value: 'foo1',
    });
    await act(async () => {
      result.find(XArrayDimensions).find('li').first().find(Select).first().props().onChange({ value: 'foo2' });
    });
    result = result.update();
    await act(async () => {
      result.find(XArrayDimensions).find('li').last().simulate('click');
    });
    result = result.update();
    await act(async () => {
      result.find(XArrayDimensions).find('li').last().find(Select).first().props().onChange({ value: 'bar2' });
    });
    result = result.update();
    await act(async () => {
      result.find('div.modal-footer').first().find('button').first().simulate('click');
    });
    result = result.update();
    expect(store.getState().xarrayDim).toEqual({ foo: 'foo2', bar: 'bar2' });
  });

  it('DataViewer: clearing selected dimensions', async () => {
    await act(async () => {
      result.find(XArrayDimensions).find('li').first().find(Select).first().props().onChange(null);
    });
    result = result.update();
    await act(async () => {
      result.find('div.modal-footer').first().find('button').first().simulate('click');
    });
    result = result.update();
    expect(store.getState().xarrayDim).toEqual({});
  });
});
