import { shallow } from 'enzyme';
import React from 'react';

import { ReactFilterDisplay } from '../../../dtale/info/FilterDisplay';
import * as serverState from '../../../dtale/serverStateManagement';
import * as menuUtils from '../../../menuUtils';
import { tick } from '../../test-utils';

describe('FilterDisplay', () => {
  let wrapper, props, updateSettingsSpy, openMenuSpy, dropFilteredRowsSpy, moveFiltersToCustomSpy;

  beforeEach(() => {
    updateSettingsSpy = jest.spyOn(serverState, 'updateSettings');
    updateSettingsSpy.mockResolvedValue(Promise.resolve({ success: true }));
    dropFilteredRowsSpy = jest.spyOn(serverState, 'dropFilteredRows');
    dropFilteredRowsSpy.mockResolvedValue(Promise.resolve({ success: true }));
    moveFiltersToCustomSpy = jest.spyOn(serverState, 'moveFiltersToCustom');
    moveFiltersToCustomSpy.mockResolvedValue(Promise.resolve({ settings: {} }));
    openMenuSpy = jest.spyOn(menuUtils, 'openMenu');
    openMenuSpy.mockImplementation(() => undefined);
    props = {
      updateSettings: jest.fn(),
      dataId: '1',
      query: 'query',
      columnFilters: { foo: { query: 'foo == 1' } },
      outlierFilters: { foo: { query: 'foo == 1' } },
      predefinedFilters: { foo: { value: 1, active: true } },
      predefinedFilterConfigs: [
        {
          name: 'custom_foo',
          column: 'foo',
          description: 'foo',
          inputType: 'input',
        },
      ],
      menuOpen: null,
      propagateState: jest.fn(),
      hideDropRows: false,
      showSidePanel: jest.fn(),
    };
    wrapper = shallow(<ReactFilterDisplay {...props} />);
  });

  afterEach(jest.restoreAllMocks);

  it('Displays all queries', () => {
    const filterLink = wrapper.find('div.filter-menu-toggle').first().find('span.pointer');
    expect(filterLink.text()).toBe('foo == 1 and foo == 1 and f...');
  });

  it('Clears all filters on clear-all', async () => {
    await wrapper.find('i.ico-cancel').last().simulate('click');
    await tick();
    expect(updateSettingsSpy).toHaveBeenCalled();
    expect(props.updateSettings).toHaveBeenLastCalledWith({
      query: '',
      columnFilters: {},
      outlierFilters: {},
      predefinedFilters: { foo: { value: 1, active: false } },
      invertFilter: false,
    });
  });

  it('Clears all filters on clear-all', async () => {
    await wrapper
      .find('div.filter-menu-toggle')
      .first()
      .find('button')
      .forEach((clear) => clear.simulate('click'));
    await tick();
    expect(updateSettingsSpy).toHaveBeenCalledTimes(4);
    expect(props.updateSettings).toHaveBeenCalledWith({ query: '' });
    expect(props.updateSettings).toHaveBeenCalledWith({ columnFilters: {} });
    expect(props.updateSettings).toHaveBeenCalledWith({ outlierFilters: {} });
    expect(props.updateSettings).toHaveBeenCalledWith({
      predefinedFilters: { foo: { value: 1, active: false } },
    });
  });

  it('Displays menu', () => {
    wrapper.find('div.filter-menu-toggle').first().simulate('click');
    expect(openMenuSpy).toHaveBeenCalled();
    openMenuSpy.mock.calls[0][0]();
    expect(props.propagateState).toHaveBeenLastCalledWith({
      menuOpen: 'filter',
    });
    openMenuSpy.mock.calls[0][1]();
    expect(props.propagateState).toHaveBeenLastCalledWith({ menuOpen: null });
  });

  it('correctly calls drop-filtered-rows', async () => {
    await wrapper.find('i.fas.fa-eraser').simulate('click');
    await tick();
    expect(dropFilteredRowsSpy).toHaveBeenCalledTimes(1);
    expect(props.updateSettings).toHaveBeenCalledWith({
      query: '',
      columnFilters: {},
      outlierFilters: {},
      predefinedFilters: { foo: { value: 1, active: false } },
      invertFilter: false,
    });
  });

  it('hides drop-filtered-rows', () => {
    wrapper.setProps({ hideDropRows: true });
    expect(wrapper.find('i.fas.fa-eraser')).toHaveLength(0);
  });

  it('correctly calls move filters to custom', async () => {
    await wrapper.find('i.fa.fa-filter').simulate('click');
    await tick();
    expect(moveFiltersToCustomSpy).toHaveBeenCalledTimes(1);
    expect(props.updateSettings).toHaveBeenCalled();
    props.updateSettings.mock.calls[0][1]();
    expect(props.showSidePanel).toHaveBeenCalledWith('filter');
  });

  it('inverts filter', async () => {
    await wrapper.find('i.fas.fa-retweet').simulate('click');
    await tick();
    expect(updateSettingsSpy).toHaveBeenCalledTimes(1);
    expect(props.updateSettings).toHaveBeenCalledWith({ invertFilter: true });
  });
});
