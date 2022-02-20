import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import * as serverState from '../../../dtale/serverStateManagement';
import FilterPopup from '../../../popups/filter/FilterPopup';
import StructuredFilters from '../../../popups/filter/StructuredFilters';
import * as chartActions from '../../../redux/actions/charts';
import { InstanceSettings, QueryEngine } from '../../../redux/state/AppState';
import { RemovableError } from '../../../RemovableError';
import * as CustomFilterRepository from '../../../repository/CustomFilterRepository';
import * as GenericRepository from '../../../repository/GenericRepository';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, tickUpdate } from '../../test-utils';

describe('FilterPopup', () => {
  let wrapper: ReactWrapper;
  let store: Store;
  let loadInfoSpy: jest.SpyInstance<Promise<CustomFilterRepository.LoadInfoResponse | undefined>, [string]>;
  let saveFilterSpy: jest.SpyInstance<Promise<GenericRepository.BaseResponse | undefined>, [string, string]>;
  let updateSettingsSpy: jest.SpyInstance<serverState.BaseReturn, [Partial<InstanceSettings>, string]>;
  let updateQueryEngineSpy: jest.SpyInstance<serverState.BaseReturn, [QueryEngine]>;

  beforeEach(async () => {
    loadInfoSpy = jest.spyOn(CustomFilterRepository, 'loadInfo');
    loadInfoSpy.mockResolvedValue({
      query: 'foo == foo',
      columnFilters: { 0: { query: 'bar == bar', type: 'col' } },
      outlierFilters: { 0: { query: 'baz == baz' } },
      predefinedFilters: {},
      contextVars: [],
      invertFilter: false,
      success: true,
    });
    saveFilterSpy = jest.spyOn(CustomFilterRepository, 'save');
    saveFilterSpy.mockResolvedValue({ success: true });
    updateSettingsSpy = jest.spyOn(serverState, 'updateSettings');
    updateSettingsSpy.mockResolvedValue(Promise.resolve({ success: true }));
    updateQueryEngineSpy = jest.spyOn(serverState, 'updateQueryEngine');
    updateQueryEngineSpy.mockResolvedValue(Promise.resolve({ success: true }));
    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '', dataId: '1', queryEngine: 'python' }, store);
    store.getState().chartData = { visible: true };
    wrapper = mount(
      <Provider store={store}>
        <FilterPopup />
      </Provider>,
      {
        attachTo: document.getElementById('content') ?? undefined,
      },
    );
    await act(async () => await tickUpdate(wrapper));
    wrapper = wrapper.update();
  });

  afterEach(jest.resetAllMocks);
  afterAll(jest.restoreAllMocks);

  const clickFilterBtn = async (text: string): Promise<ReactWrapper> => {
    await act(async () => {
      wrapper
        .find(FilterPopup)
        .first()
        .find('button')
        .findWhere((btn) => btn.text() === text)
        .first()
        .simulate('click');
    });
    return wrapper.update();
  };

  it('renders successfully', () => {
    expect(wrapper.html()).not.toBeNull();
  });

  it('drops filter', async () => {
    await act(async () => {
      wrapper.find(StructuredFilters).first().props().dropFilter('0');
    });
    wrapper = wrapper.update();
    expect(updateSettingsSpy).toHaveBeenCalledTimes(1);
    expect(wrapper.find(StructuredFilters).first().props().filters).toEqual({});
  });

  it('saves filter', async () => {
    const onCloseSpy = jest.spyOn(chartActions, 'closeChart');
    await act(async () => {
      wrapper.find('textarea').simulate('change', { target: { value: 'foo == foo' } });
    });
    wrapper = wrapper.update();
    wrapper = await clickFilterBtn('Apply');
    expect(saveFilterSpy).toHaveBeenCalledWith('1', 'foo == foo');
    expect(store.getState().settings.query).toBe('foo == foo');
    expect(onCloseSpy).toHaveBeenCalledTimes(1);
    onCloseSpy.mockRestore();
  });

  it('save failure', async () => {
    saveFilterSpy.mockResolvedValue({ error: 'error', success: false });
    await act(async () => {
      wrapper.find('textarea').simulate('change', { target: { value: 'foo == foo' } });
    });
    wrapper = wrapper.update();
    wrapper = await clickFilterBtn('Apply');
    expect(wrapper.find(RemovableError).props().error).toBe('error');
    await act(async () => {
      wrapper.find(RemovableError).first().props().onRemove?.();
    });
    wrapper = wrapper.update();
    expect(wrapper.find(RemovableError)).toHaveLength(0);
  });

  it('clears filter', async () => {
    const onCloseSpy = jest.spyOn(chartActions, 'closeChart');
    wrapper = await clickFilterBtn('Clear');
    expect(updateSettingsSpy).toHaveBeenCalledWith({ query: '' }, '1');
    expect(onCloseSpy).toHaveBeenCalledTimes(1);
    onCloseSpy.mockRestore();
  });

  it('updates query engine', async () => {
    wrapper = await clickFilterBtn('numexpr');
    expect(updateQueryEngineSpy).toHaveBeenCalledTimes(1);
    expect(updateQueryEngineSpy.mock.calls[0][0]).toBe('numexpr');
  });

  describe('new window', () => {
    const { location, close, opener } = window;

    beforeAll(() => {
      delete (window as any).location;
      delete (window as any).close;
      delete window.opener;
      (window as any).location = { pathname: '/dtale/popup/filter' };
      window.close = jest.fn();
      window.opener = {
        location: {
          reload: jest.fn(),
        },
      };
    });

    afterEach(jest.resetAllMocks);

    afterAll(() => {
      window.location = location;
      window.close = close;
      window.opener = opener;
    });

    it('drops filter', async () => {
      await act(async () => {
        wrapper.find(StructuredFilters).first().props().dropFilter('0');
      });
      wrapper = wrapper.update();
      expect(updateSettingsSpy).toHaveBeenCalledTimes(1);
      expect(window.opener.location.reload).toHaveBeenCalledTimes(1);
    });

    it('saves filter', async () => {
      await act(async () => {
        wrapper.find('textarea').simulate('change', { target: { value: 'foo == foo' } });
      });
      wrapper = wrapper.update();
      wrapper = await clickFilterBtn('Apply');
      expect(window.opener.location.reload).toHaveBeenCalledTimes(1);
      expect(window.close).toHaveBeenCalledTimes(1);
    });

    it('clears filter', async () => {
      wrapper = await clickFilterBtn('Clear');
      expect(window.opener.location.reload).toHaveBeenCalledTimes(1);
      expect(window.close).toHaveBeenCalledTimes(1);
    });
  });
});
