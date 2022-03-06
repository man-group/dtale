import { shallow, ShallowWrapper } from 'enzyme';
import * as React from 'react';
import * as redux from 'react-redux';

import LogoutOption from '../../../dtale/menu/LogoutOption';
import { AppState } from '../../../redux/state/AppState';

describe('LogoutOption', () => {
  let wrapper: ShallowWrapper;
  let useSelectorSpy: jest.SpyInstance;

  const buildMock = (props?: Partial<AppState>): void => {
    useSelectorSpy.mockReturnValue({ username: 'aschonfeld', auth: true, ...props });
    wrapper = shallow(<LogoutOption open={jest.fn()} />);
  };

  beforeEach(() => {
    useSelectorSpy = jest.spyOn(redux, 'useSelector');
    buildMock();
  });

  it('renders sucessfully', () => {
    expect(wrapper.find('span.font-weight-bold').text()).toBe('Logout, aschonfeld');
  });

  it('shows null when no auth', () => {
    buildMock({ auth: false });
    expect(wrapper.html()).toBeNull();
  });
});
