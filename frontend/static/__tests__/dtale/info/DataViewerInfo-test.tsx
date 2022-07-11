import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import DataViewerInfo, { DataViewerInfoProps } from '../../../dtale/info/DataViewerInfo';
import * as serverState from '../../../dtale/serverStateManagement';
import { AppState, SortDir } from '../../../redux/state/AppState';
import { RemovableError } from '../../../RemovableError';
import * as GenericRepository from '../../../repository/GenericRepository';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, tickUpdate } from '../../test-utils';

describe('DataViewerInfo tests', () => {
  let store: Store;
  let props: DataViewerInfoProps;
  let postSpy: jest.SpyInstance;
  let updateSettingsSpy: jest.SpyInstance;

  beforeEach(() => {
    updateSettingsSpy = jest.spyOn(serverState, 'updateSettings');
    updateSettingsSpy.mockResolvedValue(Promise.resolve({ settings: {} }));
    postSpy = jest.spyOn(GenericRepository, 'postDataToService');
    postSpy.mockResolvedValue(Promise.resolve({ data: {} }));
    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
  });

  afterEach(jest.restoreAllMocks);

  const buildInfo = async (
    additionalProps?: Partial<DataViewerInfoProps>,
    reduxState?: Partial<AppState>,
  ): Promise<ReactWrapper> => {
    props = { propagateState: jest.fn(), columns: [], ...additionalProps };
    Object.entries({ dataId: '1', ...reduxState }).forEach(([key, value]) => (store.getState()[key] = value));
    const result = mount(
      <Provider store={store}>
        <DataViewerInfo {...props} />
      </Provider>,
      { attachTo: document.getElementById('content') ?? undefined },
    );
    await act(async () => tickUpdate(result));
    return result.update();
  };

  it('DataViewerInfo rendering errors', async () => {
    const result = await buildInfo({
      error: <RemovableError error="Error test" traceback="Traceback test" />,
    });
    expect(result.find(RemovableError).length).toBe(1);
  });

  it('DataViewerInfo rendering hidden', async () => {
    const result = await buildInfo({ columns: [{ name: 'a', dtype: 'string', index: 0, visible: false }] });
    expect(result.find('div.col').last().text()).toBe('Hidden:a');
  });

  it('DataViewerInfo rendering lots of hidden', async () => {
    let result = await buildInfo({
      columns: Array.from({ length: 10 }, (value: number, idx: number) => ({
        name: `test_col${idx}`,
        visible: false,
        dtype: 'string',
        index: idx,
      })),
    });
    const hiddenLink = result.find('div.col').last().find('span.pointer');
    expect(hiddenLink.text()).toBe('10 Columns');
    await act(async () => {
      hiddenLink.simulate('click');
    });
    result = result.update();
    result.find('div.hidden-menu-toggle').find('button').first().simulate('click');
    await tickUpdate(result);
  });

  it('DataViewerInfo rendering lots of filters', async () => {
    let result = await buildInfo(undefined, {
      settings: {
        query: 'foo == 1',
        columnFilters: {
          bar: { type: 'string', query: 'bar == 1' },
          baz: { type: 'string', query: 'baz == 1' },
        },
        allow_cell_edits: true,
        hide_shutdown: false,
        precision: 2,
        verticalHeaders: false,
        predefinedFilters: {},
      },
    });
    const filterLink = result.find('div.filter-menu-toggle').first().find('span.pointer');
    expect(filterLink.text()).toBe('bar == 1 and baz == 1 and f...');
    await act(async () => {
      filterLink.simulate('click');
    });
    result = result.update();
    await act(async () => {
      result.find('div.filter-menu-toggle').find('button').first().simulate('click');
    });
    result = result.update();
    await act(async () => {
      result.find('div.filter-menu-toggle').find('button').last().simulate('click');
    });
    result = result.update();
    expect(store.getState().settings).toEqual(
      expect.objectContaining({ query: '', columnFilters: { baz: { type: 'string', query: 'baz == 1' } } }),
    );
  });

  it('DataViewerInfo rendering lots of sorts', async () => {
    let result = await buildInfo(undefined, {
      settings: {
        sortInfo: [
          ['foo', SortDir.ASC],
          ['bar', SortDir.DESC],
          ['baz', SortDir.ASC],
        ],
        allow_cell_edits: true,
        hide_shutdown: false,
        precision: 2,
        verticalHeaders: false,
        predefinedFilters: {},
      },
    });
    const sortLink = result.find('div.sort-menu-toggle').first().find('span.pointer');
    expect(sortLink.text()).toBe('foo (ASC), bar (DESC), baz (ASC)');
    await act(async () => {
      sortLink.simulate('click');
    });
    result = result.update();
    await act(async () => {
      result.find('div.sort-menu-toggle').find('button').first().simulate('click');
    });
    result = result.update();
    expect(store.getState().settings.sortInfo).toEqual([
      ['bar', SortDir.DESC],
      ['baz', SortDir.ASC],
    ]);
  });
});
