import { act, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';

import { MenuTooltip } from '../../../dtale/menu/MenuTooltip';
import XArrayOption from '../../../dtale/menu/XArrayOption';
import { ActionType } from '../../../redux/actions/AppActions';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML } from '../../test-utils';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

const useDispatchMock = useDispatch as jest.Mock;

describe('XArrayOption tests', () => {
  const mockDispatch = jest.fn();

  beforeEach(() => useDispatchMock.mockImplementation(() => mockDispatch));

  afterEach(jest.restoreAllMocks);

  it('renders selected xarray dimensions', async () => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '', xarray: 'True' }, store);
    store.dispatch({ type: ActionType.UPDATE_XARRAY_DIM, xarrayDim: { foo: 1 } });
    await act(
      () =>
        render(
          <Provider store={store}>
            <XArrayOption columns={[]} />
            <MenuTooltip />
          </Provider>,
          {
            container: document.getElementById('content') ?? undefined,
          },
        ).container,
    );
    const menuItem = screen.getByText('XArray Dimensions');
    await act(async () => {
      await fireEvent.mouseOver(menuItem);
      await fireEvent.mouseLeave(menuItem);
    });
    expect(mockDispatch.mock.calls[0][0].content.endsWith('1 (foo)')).toBe(true);
  });
});
