import { shallow, ShallowWrapper } from 'enzyme';
import * as React from 'react';
import * as redux from 'react-redux';

import DataMenuItem, { DataMenuItemProps } from '../../../dtale/ribbon/DataMenuItem';
import { ActionType } from '../../../redux/actions/AppActions';

describe('DataMenuItem', () => {
  let wrapper: ShallowWrapper;
  let props: DataMenuItemProps;
  const { location } = window;
  const dispatchSpy = jest.fn();

  beforeEach(() => {
    const useSelectorSpy = jest.spyOn(redux, 'useSelector');
    useSelectorSpy.mockReturnValue(false);
    const useDispatchSpy = jest.spyOn(redux, 'useDispatch');
    useDispatchSpy.mockReturnValue(dispatchSpy);
    delete (window as any).location;
    (window as any).location = {
      assign: jest.fn(),
      origin: 'origin',
    };
    props = {
      id: '1',
      name: 'foo',
      cleanup: jest.fn(),
    };
    wrapper = shallow(<DataMenuItem {...props} />);
  });

  afterEach(jest.resetAllMocks);

  afterAll(() => {
    window.location = location;
    jest.restoreAllMocks();
  });

  it('correctly calls show/hide tooltip on button', () => {
    wrapper
      .find('button')
      .props()
      .onMouseOver?.({} as React.MouseEvent);
    expect(dispatchSpy).toHaveBeenLastCalledWith(expect.objectContaining({ type: ActionType.SHOW_MENU_TOOLTIP }));
    wrapper
      .find('button')
      .props()
      .onMouseLeave?.({} as React.MouseEvent);
    expect(dispatchSpy).toHaveBeenLastCalledWith({ type: ActionType.HIDE_MENU_TOOLTIP });
  });

  it('correctly calls show/hide tooltip on icon', () => {
    wrapper
      .find('i')
      .props()
      .onMouseOver?.({} as React.MouseEvent);
    expect(dispatchSpy).toHaveBeenLastCalledWith(expect.objectContaining({ type: ActionType.SHOW_MENU_TOOLTIP }));
    wrapper
      .find('i')
      .props()
      .onMouseLeave?.({} as React.MouseEvent);
    expect(dispatchSpy).toHaveBeenLastCalledWith({ type: ActionType.HIDE_MENU_TOOLTIP });
  });

  it('correctly updates view', () => {
    wrapper
      .find('button')
      .props()
      .onClick?.({} as React.MouseEvent);
    expect(window.location.assign).toHaveBeenCalledWith('origin/dtale/main/1');
    expect(dispatchSpy).toHaveBeenLastCalledWith({ type: ActionType.HIDE_RIBBON_MENU });
  });

  it('correctly clears data', () => {
    wrapper
      .find('i')
      .props()
      .onClick?.({} as React.MouseEvent);
    expect(props.cleanup).toHaveBeenCalledWith('1');
    expect(dispatchSpy).toHaveBeenLastCalledWith({ type: ActionType.HIDE_RIBBON_MENU });
  });

  it('renders data name', () => {
    expect(wrapper.find('button').text()).toBe('1 - foo');
  });
});
