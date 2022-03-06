import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { DataViewer } from '../../dtale/DataViewer';
import DataViewerInfo from '../../dtale/info/DataViewerInfo';
import FilterPanel from '../../popups/filter/FilterPanel';
import StructuredFilters, { StructuredFiltersProps } from '../../popups/filter/StructuredFilters';
import { RemovableError } from '../../RemovableError';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, clickMainMenuButton, mockChartJS, tickUpdate } from '../test-utils';

describe('FilterPanel', () => {
  let result: ReactWrapper;
  let store: Store;
  const { open } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 775,
  });
  const openFn = jest.fn();

  beforeAll(() => {
    dimensions.beforeAll();

    delete (window as any).open;
    window.open = openFn;

    mockChartJS();
  });

  beforeEach(async () => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
  });

  afterEach(jest.resetAllMocks);

  afterAll(() => {
    dimensions.afterAll();
    window.open = open;
    jest.restoreAllMocks();
  });

  const toggleFilterMenu = async (): Promise<void> => {
    result = await clickMainMenuButton(result, 'Custom Filter');
  };

  const buildResult = async (dataId = '1'): Promise<void> => {
    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '', dataId }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      {
        attachTo: document.getElementById('content') ?? undefined,
      },
    );
    await act(async () => await tickUpdate(result));
    result = result.update();
    await toggleFilterMenu();
  };

  const clickFilterBtn = async (text: string): Promise<void> => {
    await act(async () => {
      result
        .find(FilterPanel)
        .first()
        .find('button')
        .findWhere((btn) => btn.text() === text)
        .first()
        .simulate('click');
    });
    result = result.update();
  };

  it('DataViewer: filtering', async () => {
    await buildResult();
    expect(result.find(FilterPanel).length).toBe(1);
    await clickFilterBtn('Close');
    result.update();
    expect(result.find(FilterPanel).length).toBe(0);
    await toggleFilterMenu();
    await clickFilterBtn('Clear');
    expect(result.find(FilterPanel).length).toBe(0);
    await toggleFilterMenu();
    await act(async () => {
      result
        .find(FilterPanel)
        .find('button')
        .findWhere((btn) => btn.text() === 'numexpr')
        .first()
        .simulate('click');
    });
    result = result.update();
    expect(store.getState().queryEngine).toBe('numexpr');
    await act(async () => {
      result
        .find(FilterPanel)
        .first()
        .find('textarea')
        .simulate('change', { target: { value: 'test' } });
    });
    result = result.update();
    await clickFilterBtn('Apply');
    expect(result.find(DataViewerInfo).first().text()).toBe('Filter:test');
    await act(async () => {
      result.find(DataViewerInfo).first().find('i.ico-cancel').last().simulate('click');
    });
    result = result.update();
    expect(result.find(DataViewerInfo).find('div.data-viewer-info.is-expanded').length).toBe(0);
  });

  it('DataViewer: filtering with errors & documentation', async () => {
    await buildResult();
    await act(async () => {
      result
        .find(FilterPanel)
        .first()
        .find('textarea')
        .simulate('change', { target: { value: 'error' } });
    });
    result = result.update();
    await clickFilterBtn('Apply');
    expect(result.find(RemovableError).find('div.dtale-alert').text()).toBe('No data found');
    await act(async () => {
      result.find(FilterPanel).find(RemovableError).first().props().onRemove?.();
    });
    result = result.update();
    expect(result.find(FilterPanel).find('div.dtale-alert').length).toBe(0);
    await clickFilterBtn('Help');
    const pandasURL = 'https://pandas.pydata.org/pandas-docs/stable/user_guide/indexing.html#indexing-query';
    expect(openFn.mock.calls[openFn.mock.calls.length - 1][0]).toBe(pandasURL);
  });

  it('DataViewer: filtering, context variables error', async () => {
    await buildResult('error');
    expect(result.find(FilterPanel).find(RemovableError).find('div.dtale-alert').text()).toBe(
      'Error loading context variables',
    );
  });

  it('DataViewer: column filters', async () => {
    await buildResult();
    const columnFilters = (): ReactWrapper<StructuredFiltersProps, Record<string, any>> =>
      result.find(FilterPanel).find(StructuredFilters).first();
    expect(columnFilters().text()).toBe('Active Column Filters:foo == 1 and');
    await act(async () => {
      columnFilters().find('i.ico-cancel').first().simulate('click');
    });
    result = result.update();
    expect(columnFilters()).toHaveLength(0);
  });
});
