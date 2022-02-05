import { shallow, ShallowWrapper } from 'enzyme';
import * as React from 'react';
import * as redux from 'react-redux';

import SidePanelButtons from '../../../dtale/side/SidePanelButtons';
import { ActionType } from '../../../redux/actions/AppActions';
import { SidePanelType } from '../../../redux/state/AppState';

describe('SidePanelButtons', () => {
  let wrapper: ShallowWrapper;
  const dispatchSpy = jest.fn();
  const openSpy = jest.fn();
  let useSelectorSpy: jest.SpyInstance;
  const { open } = window;

  beforeAll(() => {
    delete (window as any).open;
    window.open = openSpy;
  });

  beforeEach(() => {
    useSelectorSpy = jest.spyOn(redux, 'useSelector');
    const useDispatchSpy = jest.spyOn(redux, 'useDispatch');
    useDispatchSpy.mockReturnValue(dispatchSpy);
  });

  afterEach(jest.resetAllMocks);

  afterAll(() => {
    window.open = open;
    jest.restoreAllMocks();
  });

  const setupMock = (): void => {
    wrapper = shallow(<SidePanelButtons />);
  };

  it('add close/tab functions', () => {
    useSelectorSpy.mockReturnValue({ dataId: '1', column: 'foo', visible: true, view: SidePanelType.DESCRIBE });
    setupMock();
    const buttons = wrapper.find('button');
    buttons.last().simulate('click');
    expect(dispatchSpy).toHaveBeenLastCalledWith({ type: ActionType.HIDE_SIDE_PANEL });
    buttons.first().simulate('click');
    expect(window.open).toHaveBeenCalledWith('/dtale/popup/describe/1?selectedCol=foo', '_blank');
  });

  it('does not render when the side panel is not visible', () => {
    useSelectorSpy.mockReturnValue({ dataId: '1', visible: false });
    setupMock();
    expect(wrapper.html()).toBeNull();
  });
});
