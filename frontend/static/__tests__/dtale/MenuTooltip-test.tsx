import { render } from '@testing-library/react';
import * as React from 'react';
import { Provider } from 'react-redux';

import { MenuTooltip } from '../../dtale/menu/MenuTooltip';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML } from '../test-utils';

describe('MenuTooltip', () => {
  const buildMock = (stateOverrides: Record<string, any> = {}) => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({}, store);
    if (stateOverrides.menuTooltip) {
      store.dispatch({ type: 'update-menu-tooltip', menuTooltip: stateOverrides.menuTooltip });
    }
    return render(
      <Provider store={store}>
        <MenuTooltip />
      </Provider>,
      { container: document.getElementById('content') ?? undefined },
    );
  };

  afterEach(jest.resetAllMocks);

  it('renders hidden by default', () => {
    const { container } = buildMock();
    const tooltip = container.getElementsByClassName('menu-description')[0] as HTMLElement;
    expect(tooltip).toBeDefined();
    expect(tooltip.style.display).toBe('none');
  });

  it('renders with visible tooltip', () => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({}, store);
    // Create element after buildInnerHTML so it's a valid child of body
    const element = document.createElement('div');
    document.body.appendChild(element);
    jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      left: 200,
      width: 50,
      height: 30,
      right: 250,
      bottom: 130,
      x: 200,
      y: 100,
      toJSON: () => ({}),
    });
    const { container } = render(
      <Provider store={store}>
        <MenuTooltip />
      </Provider>,
      { container: document.getElementById('content') ?? undefined },
    );
    const tooltip = container.getElementsByClassName('menu-description')[0] as HTMLElement;
    expect(tooltip).toBeDefined();
    document.body.removeChild(element);
  });
});
