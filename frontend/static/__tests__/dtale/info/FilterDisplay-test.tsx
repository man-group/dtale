import { shallow, ShallowWrapper } from 'enzyme';
import * as React from 'react';
import * as redux from 'react-redux';

import { default as FilterDisplay, FilterDisplayProps, Queries } from '../../../dtale/info/FilterDisplay';
import { InfoMenuType } from '../../../dtale/info/infoUtils';
import * as serverState from '../../../dtale/serverStateManagement';
import * as menuUtils from '../../../menuUtils';
import { ActionType } from '../../../redux/actions/AppActions';
import * as settingsActions from '../../../redux/actions/settings';
import { AppState, SidePanelType } from '../../../redux/state/AppState';
import { tick } from '../../test-utils';

describe('FilterDisplay', () => {
  let wrapper: ShallowWrapper;
  let props: FilterDisplayProps;
  let updateSettingsSpy: jest.SpyInstance;
  let openMenuSpy: jest.SpyInstance;
  let dropFilteredRowsSpy: jest.SpyInstance;
  let moveFiltersToCustomSpy: jest.SpyInstance;
  let useSelectorSpy: jest.SpyInstance;
  let updateSettingsActionSpy: jest.SpyInstance;

  const dispatchSpy = jest.fn();

  const buildMock = (appState?: Partial<AppState>): void => {
    useSelectorSpy.mockReturnValue({
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
      hideDropRows: false,
      ...appState,
    });
    props = {
      menuOpen: undefined,
      setMenuOpen: jest.fn(),
    };
    wrapper = shallow(<FilterDisplay {...props} />);
  };

  beforeEach(() => {
    updateSettingsSpy = jest.spyOn(serverState, 'updateSettings');
    updateSettingsSpy.mockResolvedValue(Promise.resolve({ success: true }));
    dropFilteredRowsSpy = jest.spyOn(serverState, 'dropFilteredRows');
    dropFilteredRowsSpy.mockResolvedValue(Promise.resolve({ success: true }));
    moveFiltersToCustomSpy = jest.spyOn(serverState, 'moveFiltersToCustom');
    moveFiltersToCustomSpy.mockResolvedValue(Promise.resolve({ settings: {} }));
    openMenuSpy = jest.spyOn(menuUtils, 'openMenu');
    openMenuSpy.mockImplementation(() => undefined);
    updateSettingsActionSpy = jest.spyOn(settingsActions, 'updateSettings');
    const useDispatchSpy = jest.spyOn(redux, 'useDispatch');
    useDispatchSpy.mockReturnValue(dispatchSpy);
    useSelectorSpy = jest.spyOn(redux, 'useSelector');
    buildMock();
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('displays all queries', () => {
    const filterLink = wrapper.find('div.filter-menu-toggle').first().find('span.pointer');
    expect(filterLink.text()).toBe('foo == 1 and foo == 1 and f...');
    expect(wrapper.find(Queries)).toHaveLength(2);
  });

  it('clears all filters on clear-all', async () => {
    await wrapper.find('i.ico-cancel').last().simulate('click');
    await tick();
    expect(updateSettingsSpy).toHaveBeenLastCalledWith(
      {
        query: '',
        columnFilters: {},
        outlierFilters: {},
        predefinedFilters: { foo: { value: 1, active: false } },
        invertFilter: false,
      },
      '1',
    );
  });

  it('clears individual filters on click', async () => {
    await wrapper
      .find('div.filter-menu-toggle')
      .first()
      .find('button')
      .forEach((clear) => clear.simulate('click'));
    await tick();
    expect(updateSettingsSpy).toHaveBeenCalledWith({ query: '' }, '1');
    expect(updateSettingsSpy).toHaveBeenCalledWith({ predefinedFilters: { foo: { value: 1, active: false } } }, '1');
  });

  it('displays menu', () => {
    wrapper.find('div.filter-menu-toggle').first().simulate('click');
    expect(openMenuSpy).toHaveBeenCalled();
    openMenuSpy.mock.calls[0][0]();
    expect(props.setMenuOpen).toHaveBeenLastCalledWith(InfoMenuType.FILTER);
    openMenuSpy.mock.calls[0][1]();
    expect(props.setMenuOpen).toHaveBeenLastCalledWith(undefined);
  });

  it('correctly calls drop-filtered-rows', async () => {
    await wrapper.find('i.fas.fa-eraser').simulate('click');
    await tick();
    expect(dropFilteredRowsSpy).toHaveBeenCalledTimes(1);
    expect(updateSettingsActionSpy).toHaveBeenCalledWith({
      query: '',
      columnFilters: {},
      outlierFilters: {},
      predefinedFilters: { foo: { value: 1, active: false } },
      invertFilter: false,
    });
  });

  it('hides drop-filtered-rows', () => {
    buildMock({ hideDropRows: true });
    expect(wrapper.find('i.fas.fa-eraser')).toHaveLength(0);
  });

  it('correctly calls move filters to custom', async () => {
    await wrapper.find('i.fa.fa-filter').simulate('click');
    await tick();
    expect(moveFiltersToCustomSpy).toHaveBeenCalledTimes(1);
    expect(updateSettingsActionSpy).toHaveBeenCalledWith({});
    expect(dispatchSpy).toHaveBeenCalledWith({ type: ActionType.SHOW_SIDE_PANEL, view: SidePanelType.FILTER });
  });

  it('inverts filter', async () => {
    await wrapper.find('i.fas.fa-retweet').simulate('click');
    await tick();
    expect(updateSettingsSpy).toHaveBeenCalledWith({ invertFilter: true }, '1');
  });

  describe('Queries', () => {
    let queries: ShallowWrapper;

    beforeEach(() => {
      useSelectorSpy.mockReturnValue('1');
      queries = shallow(<Queries prop="columnFilters" filters={{ foo: { query: 'foo == 1' } }} />);
    });

    it('renders successfully', () => {
      expect(queries.find('span.font-weight-bold').first().text()).toBe('foo == 1');
    });

    it('clears all', async () => {
      await queries.find('button').forEach((clear) => clear.simulate('click'));
      expect(updateSettingsSpy).toHaveBeenCalledWith({ columnFilters: {} }, '1');
    });
  });
});
