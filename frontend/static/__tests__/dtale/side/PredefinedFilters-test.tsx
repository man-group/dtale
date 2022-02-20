import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';

import * as serverState from '../../../dtale/serverStateManagement';
import FilterInput from '../../../dtale/side/predefined_filters/FilterInput';
import PredefinedFilters from '../../../dtale/side/predefined_filters/Panel';
import { ActionType } from '../../../redux/actions/AppActions';
import * as settingsActions from '../../../redux/actions/settings';
import reduxUtils from '../../redux-test-utils';
import { tickUpdate } from '../../test-utils';

describe('PredefinedFilters panel', () => {
  let wrapper: ReactWrapper;
  let useSelectorSpy: jest.SpyInstance;
  let updateSettingsSpy: jest.SpyInstance;
  let updateSettingsActionSpy: jest.SpyInstance;
  const dispatchSpy = jest.fn();

  beforeEach(async () => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
    useSelectorSpy = jest.spyOn(redux, 'useSelector');
    useSelectorSpy.mockReturnValue({
      dataId: '1',
      predefinedFilters: [
        {
          name: 'custom_foo1',
          description: 'custom_foo1 description',
          column: 'col1',
          inputType: 'input',
        },
        {
          name: 'custom_foo2',
          description: 'custom_foo2 description',
          column: 'col1',
          inputType: 'select',
        },
        {
          name: 'custom_foo3',
          description: 'custom_foo3 description',
          column: 'col1',
          inputType: 'multiselect',
        },
      ],
      filterValues: {
        custom_foo1: { value: 1, active: true },
        custom_foo2: { value: 1, active: true },
        custom_foo3: { value: [1, 2], active: true },
      },
    });
    const useDispatchSpy = jest.spyOn(redux, 'useDispatch');
    useDispatchSpy.mockReturnValue(dispatchSpy);
    updateSettingsSpy = jest.spyOn(serverState, 'updateSettings');
    updateSettingsSpy.mockResolvedValue(Promise.resolve(undefined));
    updateSettingsActionSpy = jest.spyOn(settingsActions, 'updateSettings');
    wrapper = mount(<PredefinedFilters />);
    await act(async () => tickUpdate(wrapper));
    wrapper = wrapper.update();
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('renders successfully', () => {
    expect(wrapper.find(FilterInput)).toHaveLength(3);
  });

  it('saves correctly', async () => {
    await act(async () => {
      wrapper.find(FilterInput).first().props().save('custom_foo1', '2', true);
    });
    wrapper = wrapper.update();
    expect(updateSettingsActionSpy).toHaveBeenCalledWith({
      predefinedFilters: {
        custom_foo1: { value: '2', active: true },
        custom_foo2: { value: 1, active: true },
        custom_foo3: { value: [1, 2], active: true },
      },
    });
  });

  it('removes correctly', async () => {
    await act(async () => {
      wrapper.find(FilterInput).first().props().save('custom_foo1', undefined, false);
    });
    wrapper = wrapper.update();
    expect(updateSettingsActionSpy).toHaveBeenCalledWith({
      predefinedFilters: {
        custom_foo1: { active: false },
        custom_foo2: { value: 1, active: true },
        custom_foo3: { value: [1, 2], active: true },
      },
    });
  });

  it('clears all correctly', async () => {
    await act(async () => {
      wrapper.find('button').at(1).simulate('click');
    });
    wrapper = wrapper.update();
    expect(updateSettingsActionSpy).toHaveBeenCalledWith({
      predefinedFilters: {
        custom_foo1: { value: 1, active: false },
        custom_foo2: { value: 1, active: false },
        custom_foo3: { value: [1, 2], active: false },
      },
    });
  });

  it('closes the panel correctly', async () => {
    wrapper.find('button').first().simulate('click');
    expect(dispatchSpy).toHaveBeenLastCalledWith({ type: ActionType.HIDE_SIDE_PANEL });
  });
});
