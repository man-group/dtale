import { act, fireEvent, render, RenderResult } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';
import { Store } from 'redux';
import { default as configureStore } from 'redux-mock-store';

import * as serverState from '../../../dtale/serverStateManagement';
import PredefinedFilters from '../../../dtale/side/predefined_filters/Panel';
import { ActionType } from '../../../redux/actions/AppActions';
import * as settingsActions from '../../../redux/actions/settings';
import reduxUtils from '../../redux-test-utils';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

const useDispatchMock = useDispatch as jest.Mock;

describe('PredefinedFilters panel', () => {
  let wrapper: RenderResult;
  const mockStore = configureStore();
  let store: Store;
  let updateSettingsSpy: jest.SpyInstance;
  let updateSettingsActionSpy: jest.SpyInstance;
  const mockDispatch = jest.fn();

  beforeEach(async () => {
    useDispatchMock.mockImplementation(() => mockDispatch);
    (axios.get as any).mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
    store = mockStore({
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
      settings: {
        predefinedFilters: {
          custom_foo1: { value: 1, active: true },
          custom_foo2: { value: 1, active: true },
          custom_foo3: { value: [1, 2], active: true },
        },
      },
    });
    updateSettingsSpy = jest.spyOn(serverState, 'updateSettings');
    updateSettingsSpy.mockResolvedValue(Promise.resolve(undefined));
    updateSettingsActionSpy = jest.spyOn(settingsActions, 'updateSettings');
    wrapper = await act(async (): Promise<RenderResult> => {
      return render(
        <Provider store={store}>
          <PredefinedFilters />
        </Provider>,
      );
    });
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  const filterInputs = (): HTMLCollectionOf<Element> =>
    wrapper.container.getElementsByClassName('predefined-filter-input');

  it('renders successfully', () => {
    expect(filterInputs()).toHaveLength(3);
  });

  it('saves correctly', async () => {
    await act(async () => {
      await fireEvent.click(filterInputs()[0].getElementsByTagName('button')[0]);
    });
    await act(async () => {
      await fireEvent.click(filterInputs()[0].getElementsByTagName('button')[2]);
    });
    await act(async () => {
      await fireEvent.change(filterInputs()[0].getElementsByTagName('input')[0], { target: { value: '2' } });
    });
    await act(async () => {
      await fireEvent.click(filterInputs()[0].getElementsByTagName('button')[1]);
    });
    expect(updateSettingsActionSpy).toHaveBeenCalledWith({
      predefinedFilters: {
        custom_foo1: { value: 2, active: true },
        custom_foo2: { value: 1, active: true },
        custom_foo3: { value: [1, 2], active: true },
      },
    });
  });

  it('removes correctly', async () => {
    await act(async () => {
      fireEvent.click(filterInputs()[0].getElementsByTagName('button')[0]);
    });
    await act(async () => {
      await fireEvent.click(filterInputs()[0].getElementsByTagName('button')[2]);
    });
    await act(async () => {
      fireEvent.change(filterInputs()[0].getElementsByTagName('input')[0], { target: { value: '' } });
    });
    await act(async () => {
      await fireEvent.click(filterInputs()[0].getElementsByTagName('button')[3]);
    });
    await act(async () => {
      await fireEvent.click(filterInputs()[0].getElementsByTagName('button')[1]);
    });
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
      fireEvent.click(wrapper.container.getElementsByTagName('button')[1]);
    });
    expect(updateSettingsActionSpy).toHaveBeenCalledWith({
      predefinedFilters: {
        custom_foo1: { value: 1, active: false },
        custom_foo2: { value: 1, active: false },
        custom_foo3: { value: [1, 2], active: false },
      },
    });
  });

  it('closes the panel correctly', async () => {
    await act(async () => {
      fireEvent.click(wrapper.container.getElementsByTagName('button')[0]);
    });
    expect(mockDispatch).toHaveBeenLastCalledWith({ type: ActionType.HIDE_SIDE_PANEL });
  });
});
