import { mount } from 'enzyme';
import _ from 'lodash';
import React from 'react';
import { Provider } from 'react-redux';

import { RemovableError } from '../../../RemovableError';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, tickUpdate } from '../../test-utils';
import * as fetcher from '../../../fetcher';
import * as serverState from '../../../dtale/serverStateManagement';

describe('DataViewerInfo tests', () => {
  let DataViewerInfo, store, props, postSpy, updateSettingsSpy;

  beforeEach(() => {
    updateSettingsSpy = jest.spyOn(serverState, 'updateSettings');
    updateSettingsSpy.mockResolvedValue(Promise.resolve({ settings: {} }));
    postSpy = jest.spyOn(fetcher, 'fetchPost');
    postSpy.mockImplementation((_url, _params, callback) => callback());
    store = reduxUtils.createDtaleStore();
    DataViewerInfo = require('../../../dtale/info/DataViewerInfo').DataViewerInfo;
    buildInnerHTML({ settings: '' }, store);
  });

  afterEach(jest.restoreAllMocks);

  const buildInfo = (additionalProps, settings) => {
    props = { propagateState: jest.fn(), ...additionalProps };
    if (settings) {
      store.getState().settings = settings;
    }
    return mount(
      <Provider store={store}>
        <DataViewerInfo {...props} />
      </Provider>,
      { attachTo: document.getElementById('content') },
    );
  };

  it('DataViewerInfo rendering errors', () => {
    const result = buildInfo({
      error: 'Error test',
      traceback: 'Traceback test',
    });
    expect(result.find(RemovableError).length).toBe(1);
    result.find(RemovableError).find('i.ico-cancel').simulate('click');
    expect(props.propagateState).toHaveBeenLastCalledWith({
      error: null,
      traceback: null,
    });
  });

  it('DataViewerInfo rendering hidden', () => {
    const result = buildInfo({ columns: [{ name: 'a', visible: false }] });
    expect(result.find('div.col').last().text()).toBe('Hidden:a');
  });

  it('DataViewerInfo rendering lots of hidden', async () => {
    const result = buildInfo({
      dataId: '1',
      columns: _.map(_.range(10), (idx) => ({
        name: `test_col${idx}`,
        visible: false,
      })),
    });
    const hiddenLink = result.find('div.col').last().find('span.pointer');
    expect(hiddenLink.text()).toBe('10 Columns');
    hiddenLink.simulate('click');
    result.find('div.hidden-menu-toggle').find('button').first().simulate('click');
    await tickUpdate(result);
  });

  it('DataViewerInfo rendering lots of filters', async () => {
    const result = buildInfo(
      { dataId: '1' },
      {
        query: 'foo == 1',
        columnFilters: {
          bar: { query: 'bar == 1' },
          baz: { query: 'baz == 1' },
        },
      },
    );
    const filterLink = result.find('div.filter-menu-toggle').first().find('span.pointer');
    expect(filterLink.text()).toBe('bar == 1 and baz == 1 and f...');
    filterLink.simulate('click');
    result.find('div.filter-menu-toggle').find('button').first().simulate('click');
    await tickUpdate(result);
    result.find('div.filter-menu-toggle').find('button').last().simulate('click');
    await tickUpdate(result);
  });

  it('DataViewerInfo rendering lots of sorts', async () => {
    const result = buildInfo(
      { dataId: '1' },
      {
        sortInfo: [
          ['foo', 'ASC'],
          ['bar', 'DESC'],
          ['baz', 'ASC'],
        ],
      },
    );
    const sortLink = result.find('div.sort-menu-toggle').first().find('span.pointer');
    expect(sortLink.text()).toBe('foo (ASC), bar (DESC), baz (ASC)');
    sortLink.simulate('click');
    result.find('div.sort-menu-toggle').find('button').first().simulate('click');
    await tickUpdate(result);
  });
});
