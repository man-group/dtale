import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';

import RibbonMenu, { RibbonMenuItem } from '../../../dtale/ribbon/RibbonMenu';
import { ActionType } from '../../../redux/actions/AppActions';
import { RibbonDropdownType } from '../../../redux/state/AppState';
import { tickUpdate } from '../../test-utils';

describe('RibbonMenu', () => {
  let wrapper: ReactWrapper;
  let useSelectorSpy: jest.SpyInstance;
  const dispatchSpy = jest.fn();

  beforeEach(async () => {
    useSelectorSpy = jest.spyOn(redux, 'useSelector');
    useSelectorSpy.mockReturnValue({ visible: true });
    const useDispatchSpy = jest.spyOn(redux, 'useDispatch');
    useDispatchSpy.mockReturnValue(dispatchSpy);
    wrapper = mount(<RibbonMenu />);
    await act(async () => tickUpdate(wrapper));
    wrapper = wrapper.update();
  });

  it('renders successfully', () => {
    expect(wrapper.find('RibbonMenuItem')).toHaveLength(5);
  });

  it('activates hover on click of item & opens dropdown', async () => {
    await act(async () => {
      wrapper.find(RibbonMenuItem).first().find('div').simulate('click');
    });
    wrapper = wrapper.update();
    expect(dispatchSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: ActionType.OPEN_RIBBON_DROPDOWN, name: RibbonDropdownType.MAIN }),
    );
  });

  it('opens dropdown when hover is active', async () => {
    await act(async () => {
      wrapper.find(RibbonMenuItem).first().find('div').simulate('click');
    });
    wrapper = wrapper.update();
    await act(async () => {
      wrapper.find(RibbonMenuItem).last().find('div').simulate('mouseover');
    });
    wrapper = wrapper.update();
    expect(dispatchSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: ActionType.OPEN_RIBBON_DROPDOWN, name: RibbonDropdownType.SETTINGS }),
    );
  });

  it('turns off hover when menu closes', async () => {
    await act(async () => {
      wrapper.find(RibbonMenuItem).first().find('div').simulate('click');
    });
    wrapper = wrapper.update();
    useSelectorSpy.mockReturnValue({ visible: false });
    await act(async () => {
      wrapper.setProps({});
    });
    wrapper = wrapper.update();
    dispatchSpy.mockReset();
    await act(async () => {
      wrapper.find(RibbonMenuItem).first().props().onHover();
    });
    wrapper = wrapper.update();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('sets main title font', () => {
    useSelectorSpy.mockReturnValue({ visible: true, mainTitleFont: 'Arial' });
    wrapper = mount(<RibbonMenu />);
    const title = wrapper.find('span.title-font-base').props();
    expect(title.className).toBe('title-font-base');
    expect(title.style?.fontFamily).toBe('Arial');
  });
});
