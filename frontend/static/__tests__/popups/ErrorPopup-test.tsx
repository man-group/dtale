import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { Provider } from 'react-redux';

import { Error } from '../../popups/ErrorPopup';
import { PopupType } from '../../redux/state/AppState';
import { RemovableError } from '../../RemovableError';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML } from '../test-utils';

describe('ErrorPopup', () => {
  let result: ReactWrapper;
  beforeEach(async () => {
    const store = reduxUtils.createDtaleStore();
    store.getState().chartData = { error: 'error test', visible: true, type: PopupType.ERROR };
    buildInnerHTML({ settings: '' }, store);
    result = mount(
      <Provider store={store}>
        <Error />
      </Provider>,
      { attachTo: document.getElementById('content') ?? undefined },
    );
  });

  it('rendering test', () => {
    expect(result.find(RemovableError).prop('error')).toBe('error test');
  });
});
