import { act, render } from '@testing-library/react';
import * as React from 'react';
import { Provider } from 'react-redux';

import LogoutOption from '../../../dtale/menu/LogoutOption';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML } from '../../test-utils';

describe('LogoutOption', () => {
  let wrapper: Element;

  const buildMock = async (props?: Record<string, string>): Promise<void> => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '', username: 'aschonfeld', auth: 'True', ...props }, store);
    wrapper = await act(
      () =>
        render(
          <Provider store={store}>
            <LogoutOption open={jest.fn()} />
          </Provider>,
          {
            container: document.getElementById('content') as HTMLElement,
          },
        ).container,
    );
  };

  it('renders sucessfully', async () => {
    await buildMock();
    expect(wrapper.textContent).toBe('Logout, aschonfeld');
  });

  it('shows null when no auth', async () => {
    await buildMock({ auth: 'False' });
    expect(wrapper.innerHTML).toBe('');
  });
});
