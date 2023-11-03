import { act, render, screen } from '@testing-library/react';
import * as React from 'react';
import { Provider } from 'react-redux';

import { Error } from '../../popups/ErrorPopup';
import { ActionType } from '../../redux/actions/AppActions';
import { PopupType } from '../../redux/state/AppState';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML } from '../test-utils';

describe('ErrorPopup', () => {
  beforeEach(async () => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    store.dispatch({
      type: ActionType.OPEN_CHART,
      chartData: { error: 'error test', visible: true, type: PopupType.ERROR },
    });

    await act(
      () =>
        render(
          <Provider store={store}>
            <Error />
          </Provider>,
          { container: document.getElementById('content') ?? undefined },
        ).container,
    );
  });

  it('rendering test', () => {
    expect(screen.getByRole('alert').textContent).toBe('error test');
  });
});
