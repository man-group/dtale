import { mount } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';

import { MenuTooltip } from '../../../dtale/menu/MenuTooltip';
import XArrayOption from '../../../dtale/menu/XArrayOption';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML } from '../../test-utils';

describe('XArrayOption tests', () => {
  afterEach(jest.restoreAllMocks);

  it('renders selected xarray dimensions', async () => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    store.getState().xarray = true;
    store.getState().xarrayDim = { foo: 1 };
    let result = mount(
      <Provider store={store}>
        <XArrayOption columns={[]} />
        <MenuTooltip />
      </Provider>,
      {
        attachTo: document.getElementById('content') ?? undefined,
      },
    );
    await act(async () => {
      result.find('li').simulate('mouseover');
    });
    result = result.update();
    expect(result.find('div.hoverable__content').text().endsWith('1 (foo)')).toBe(true);
  });
});
