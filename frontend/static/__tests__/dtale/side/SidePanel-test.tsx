import { shallow, ShallowWrapper } from 'enzyme';
import * as React from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { GlobalHotKeys } from 'react-hotkeys';
import * as redux from 'react-redux';

jest.mock('../../../dtale/side/MissingNoCharts', () => {
  const { createMockComponent } = require('../../mocks/createMockComponent');
  return {
    __esModule: true,
    default: createMockComponent(),
  };
});

import { SidePanel } from '../../../dtale/side/SidePanel';
import { ActionType } from '../../../redux/actions/AppActions';
import { SidePanelType } from '../../../redux/state/AppState';

describe('SidePanel', () => {
  let wrapper: ShallowWrapper;
  const dispatchSpy = jest.fn();
  let useSelectorSpy: jest.SpyInstance;

  const setupMock = (overrides?: Record<string, any>): void => {
    useSelectorSpy.mockReturnValue({ visible: false, ...overrides });
    wrapper = shallow(<SidePanel gridPanel={document.createElement('div')} />);
  };

  beforeEach(async () => {
    useSelectorSpy = jest.spyOn(redux, 'useSelector');
    const useDispatchSpy = jest.spyOn(redux, 'useDispatch');
    useDispatchSpy.mockReturnValue(dispatchSpy);
    setupMock();
  });

  afterEach(jest.clearAllMocks);

  afterAll(jest.restoreAllMocks);

  it('renders successfully', () => {
    expect(wrapper.find('div.side-panel-content')).toHaveLength(1);
    expect(wrapper.find('div').children()).toHaveLength(1);
  });

  it('shows missing charts', () => {
    setupMock({ visible: true, view: SidePanelType.MISSINGNO });
    expect(wrapper.find('div.side-panel-content.is-expanded')).toHaveLength(1);
    expect(wrapper.find('div').children()).toHaveLength(5);
  });

  it('shows Gage R&R', () => {
    setupMock({ visible: true, view: SidePanelType.GAGE_RNR });
    expect(wrapper.find('div.side-panel-content.is-expanded')).toHaveLength(1);
    expect(wrapper.find('div').children()).toHaveLength(5);
  });

  it('shows predefined filters', () => {
    setupMock({ visible: true, view: SidePanelType.PREDEFINED_FILTERS });
    expect(wrapper.find('div.side-panel-content.is-expanded')).toHaveLength(1);
    expect(wrapper.find('div').children()).toHaveLength(5);
  });

  it('hides side panel on ESC', () => {
    setupMock({ visible: true });
    const { keyMap, handlers } = wrapper.find(GlobalHotKeys).props();
    expect(keyMap?.CLOSE_PANEL).toBe('esc');
    const closePanel = handlers?.CLOSE_PANEL;
    closePanel?.();
    expect(dispatchSpy).toHaveBeenLastCalledWith({ type: ActionType.HIDE_SIDE_PANEL });
  });

  it('handles resize', () => {
    setupMock({ visible: true });
    wrapper
      .find(Draggable)
      .props()
      .onStart?.({} as any as DraggableEvent, {} as any as DraggableData);
    wrapper
      .find(Draggable)
      .props()
      .onDrag?.({} as any as DraggableEvent, { deltaX: -20 } as DraggableData);
    wrapper
      .find(Draggable)
      .props()
      .onStop?.({} as any as DraggableEvent, {} as any as DraggableData);
    expect(dispatchSpy).toHaveBeenLastCalledWith({ type: ActionType.UPDATE_SIDE_PANEL_WIDTH, offset: -20 });
  });
});
