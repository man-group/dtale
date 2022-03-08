import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';

jest.mock('../../../dtale/menu/MaxDimensionOption', () => {
  const { createMockComponent } = require('../../mocks/createMockComponent');
  return {
    MaxHeightOption: createMockComponent(),
    MaxWidthOption: createMockComponent(),
  };
});

import CorrelationsOption from '../../../dtale/menu/CorrelationsOption';
import * as menuFuncs from '../../../dtale/menu/dataViewerMenuUtils';
import FilterOption from '../../../dtale/menu/FilterOption';
import { MenuItem } from '../../../dtale/menu/MenuItem';
import MergeOption from '../../../dtale/menu/MergeOption';
import MissingOption from '../../../dtale/menu/MissingOption';
import PPSOption from '../../../dtale/menu/PPSOption';
import PredefinedFiltersOption from '../../../dtale/menu/PredefinedFiltersOption';
import ShowHideColumnsOption from '../../../dtale/menu/ShowHideColumnsOption';
import DataMenuItem from '../../../dtale/ribbon/DataMenuItem';
import RibbonDropdown, { RibbonDropdownProps } from '../../../dtale/ribbon/RibbonDropdown';
import { ActionType } from '../../../redux/actions/AppActions';
import { RibbonDropdownType, SidePanelType } from '../../../redux/state/AppState';
import * as InstanceRepository from '../../../repository/InstanceRepository';
import DimensionsHelper from '../../DimensionsHelper';
import { tickUpdate } from '../../test-utils';

describe('RibbonDropdown', () => {
  let wrapper: ReactWrapper;
  let props: RibbonDropdownProps;
  let useSelectorSpy: jest.SpyInstance;
  let cleanupSpy: jest.SpyInstance;
  const processes = [{ id: '2', name: 'foo' }, { id: '3' }];
  const { location, open } = window;
  const dispatchSpy = jest.fn();
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 500,
    innerHeight: 500,
  });

  const setupElementAndDropdown = async (name: RibbonDropdownType, dims?: Partial<DOMRect>): Promise<void> => {
    const rectSpy = jest.spyOn(HTMLDivElement.prototype, 'getBoundingClientRect');
    rectSpy.mockImplementation(() => ({ left: 5, top: 5, width: 10, ...dims } as DOMRect));
    useSelectorSpy.mockReturnValue({
      dataId: '1',
      visible: true,
      name,
      settings: {},
      isVSCode: false,
      element: { getBoundingClientRect: () => ({ left: 5, top: 5, width: 10, ...dims } as DOMRect) },
    });
    wrapper = mount(<RibbonDropdown {...props} />);
    await act(async () => await tickUpdate(wrapper));
    wrapper = wrapper.update();
  };

  beforeEach(() => {
    dimensions.beforeAll();
    delete (window as any).location;
    delete (window as any).open;
    window.open = jest.fn();
    (window as any).location = { reload: jest.fn() };
    useSelectorSpy = jest.spyOn(redux, 'useSelector');
    useSelectorSpy.mockReturnValue({ dataId: '1', visisble: false });
    const useDispatchSpy = jest.spyOn(redux, 'useDispatch');
    useDispatchSpy.mockReturnValue(dispatchSpy);
    cleanupSpy = jest.spyOn(InstanceRepository, 'cleanupInstance');
    cleanupSpy.mockResolvedValue({ success: true });
    const loadProcessKeysSpy = jest.spyOn(InstanceRepository, 'loadProcessKeys');
    loadProcessKeysSpy.mockResolvedValue({ data: processes, success: true });
    props = {
      columns: [],
      rows: 10,
      propagateState: jest.fn(),
    };
  });

  afterEach(jest.resetAllMocks);

  afterAll(() => {
    dimensions.afterAll();
    window.location = location;
    window.open = open;
    jest.restoreAllMocks();
  });

  it('renders successfully', async () => {
    wrapper = mount(<RibbonDropdown {...props} />);
    await act(async () => await tickUpdate(wrapper));
    wrapper = wrapper.update();
    expect(wrapper.find('div')).toHaveLength(1);
  });

  it('stops propagation on clicks', () => {
    const event = {
      stopPropagation: jest.fn(),
      preventDefault: jest.fn(),
    } as any as React.MouseEvent;
    wrapper.find('div').props().onClick?.(event);
    expect(event.stopPropagation).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it('renders main successfully', async () => {
    await setupElementAndDropdown(RibbonDropdownType.MAIN);
    expect(wrapper.find(DataMenuItem)).toHaveLength(processes.length);
    expect(wrapper.find('div').first().props().style).toEqual({ left: 5, top: 30 });
    useSelectorSpy.mockReturnValue({ dataId: '1', name: undefined, element: undefined });
    wrapper.setProps({ visible: false });
    await act(async () => await tickUpdate(wrapper));
    wrapper = wrapper.update();
    expect(wrapper.find('div').props().style).toEqual({});
  });

  it('handles screen edge successfully', async () => {
    await setupElementAndDropdown(RibbonDropdownType.MAIN, { left: 450, width: 100 });
    expect(wrapper.find('div').first().props().style).toEqual({ left: 380, top: 30 });
  });

  it('can clear current data', async () => {
    await setupElementAndDropdown(RibbonDropdownType.MAIN);
    await act(async () => {
      wrapper.find(MenuItem).at(5).props().onClick?.();
    });
    expect(cleanupSpy).toBeCalledWith('1');
    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });

  it('can clear other data', async () => {
    await setupElementAndDropdown(RibbonDropdownType.MAIN);
    await act(async () => {
      wrapper.find(DataMenuItem).first().props().cleanup('2');
    });
    wrapper = wrapper.update();
    expect(cleanupSpy).toBeCalledWith('2');
    expect(wrapper.find(DataMenuItem)).toHaveLength(0);
  });

  it('renders actions successfully', async () => {
    await setupElementAndDropdown(RibbonDropdownType.ACTIONS);
    expect(wrapper.find('ul')).toHaveLength(1);
    await act(async () => {
      wrapper.find(ShowHideColumnsOption).props().open();
    });
    expect(dispatchSpy).toHaveBeenCalledWith({ type: ActionType.SHOW_SIDE_PANEL, view: SidePanelType.SHOW_HIDE });
    expect(dispatchSpy).toHaveBeenLastCalledWith({ type: ActionType.HIDE_RIBBON_MENU });
    await act(async () => {
      wrapper.find(FilterOption).props().open();
    });
    expect(dispatchSpy).toHaveBeenCalledWith({ type: ActionType.SHOW_SIDE_PANEL, view: SidePanelType.FILTER });
    expect(dispatchSpy).toHaveBeenLastCalledWith({ type: ActionType.HIDE_RIBBON_MENU });
    await act(async () => {
      wrapper.find(PredefinedFiltersOption).props().open();
    });
    expect(dispatchSpy).toHaveBeenCalledWith({
      type: ActionType.SHOW_SIDE_PANEL,
      view: SidePanelType.PREDEFINED_FILTERS,
    });
  });

  it('renders visualize successfully', async () => {
    await setupElementAndDropdown(RibbonDropdownType.VISUALIZE);
    expect(wrapper.find('ul')).toHaveLength(1);
    await act(async () => {
      wrapper.find(MissingOption).props().open();
    });
    expect(dispatchSpy).toHaveBeenCalledWith({ type: ActionType.SHOW_SIDE_PANEL, view: SidePanelType.MISSINGNO });
    await act(async () => {
      wrapper.find(CorrelationsOption).props().open();
    });
    expect(dispatchSpy).toHaveBeenCalledWith({ type: ActionType.SHOW_SIDE_PANEL, view: SidePanelType.CORRELATIONS });
    expect(dispatchSpy).toHaveBeenLastCalledWith({ type: ActionType.HIDE_RIBBON_MENU });
    await act(async () => {
      wrapper.find(PPSOption).props().open();
    });
    expect(dispatchSpy).toHaveBeenCalledWith({ type: ActionType.SHOW_SIDE_PANEL, view: SidePanelType.PPS });
    expect(dispatchSpy.mock.calls.filter((call) => call[0].type === ActionType.HIDE_RIBBON_MENU)).toHaveLength(3);
  });

  it('renders highlight successfully', async () => {
    await setupElementAndDropdown(RibbonDropdownType.HIGHLIGHT);
    expect(wrapper.find('ul')).toHaveLength(1);
  });

  it('renders settings successfully', async () => {
    await setupElementAndDropdown(RibbonDropdownType.SETTINGS);
    expect(wrapper.find('ul')).toHaveLength(1);
  });

  it('hides menu on click', async () => {
    const funcsSpy = jest.spyOn(menuFuncs, 'buildHotkeyHandlers');
    funcsSpy.mockImplementation(() => ({
      openTab: jest.fn(),
      openPopup: jest.fn(),
      toggleBackground: jest.fn(),
      toggleOutlierBackground: jest.fn(),
      CODE: jest.fn(),
      SHUTDOWN: jest.fn(),
      BUILD: jest.fn(),
      FILTER: jest.fn(),
      DESCRIBE: jest.fn(),
      DUPLICATES: jest.fn(),
      CHARTS: jest.fn(),
      NETWORK: jest.fn(),
      MENU: jest.fn(),
      CLEAN: jest.fn(),
      ABOUT: jest.fn(),
      LOGOUT: jest.fn(),
    }));
    await setupElementAndDropdown(RibbonDropdownType.MAIN);
    await setupElementAndDropdown(RibbonDropdownType.ACTIONS);
    await act(async () => {
      wrapper.find(MergeOption).props().open();
    });
    expect(window.open).toHaveBeenCalledWith('/dtale/popup/merge', '_blank');
    expect(dispatchSpy.mock.calls.filter((call) => call[0].type === ActionType.HIDE_RIBBON_MENU)).toHaveLength(1);
  });
});
