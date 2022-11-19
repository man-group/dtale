import { act, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { Provider } from 'react-redux';

import { ColumnFilter } from '../../dtale/DataViewerState';
import { NE_OPTION } from '../../filters/NumericFilter';
import { default as StringFilter, StringFilterProps } from '../../filters/StringFilter';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, selectOption } from '../test-utils';

describe('StringFilter', () => {
  let wrapper: Element;
  let updateState: jest.Mock<Promise<void>, [ColumnFilter?]>;
  let props: StringFilterProps;

  beforeEach(async () => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    updateState = jest.fn((state?: ColumnFilter) => Promise.resolve(undefined));
    props = {
      selectedCol: 'foo',
      columnFilter: { type: 'string', value: ['a'], action: 'equals', operand: 'ne' },
      updateState,
      uniques: ['a', 'b', 'c'],
      missing: false,
      uniqueCt: 3,
    };
    wrapper = await act(
      async () =>
        render(
          <Provider store={store}>
            <StringFilter {...props} />
          </Provider>,
          { container: document.getElementById('content') ?? undefined },
        ).container,
    );
  });

  afterEach(jest.restoreAllMocks);

  it('reads presets successfully', async () => {
    expect(wrapper.querySelector('button.active')!.textContent).toBe(NE_OPTION.label);
    await act(async () => {
      await fireEvent.click(screen.getByText('Aa'));
    });
    expect(updateState).toHaveBeenLastCalledWith(
      expect.objectContaining({ caseSensitive: true, value: ['a'], action: 'equals' }),
    );
  });

  it('handles case-sensitive update', async () => {
    await act(async () => {
      await fireEvent.click(screen.getByText('Aa'));
    });
    expect(updateState).toHaveBeenLastCalledWith(expect.objectContaining({ caseSensitive: true }));
  });

  it('handles action/raw update', async () => {
    await selectOption(wrapper.getElementsByClassName('Select')[0] as HTMLElement, 'startswith');
    expect(wrapper.querySelectorAll('input.form-control')).toHaveLength(1);
    const inputs = [...wrapper.getElementsByTagName('input')];
    await act(async () => {
      await fireEvent.change(inputs[inputs.length - 1], { target: { value: 'b' } });
    });
    await act(async () => {
      await fireEvent.keyDown(inputs[inputs.length - 1], { keyCode: 13 });
    });
    expect(updateState).toHaveBeenLastCalledWith(expect.objectContaining({ raw: 'b' }));
  });

  it('handles length check', async () => {
    await selectOption(wrapper.getElementsByClassName('Select')[0] as HTMLElement, 'length');
    expect(wrapper.querySelectorAll('input.form-control')).toHaveLength(1);
    updateState.mockReset();
    const inputs = [...wrapper.getElementsByTagName('input')];
    await act(async () => {
      await fireEvent.change(inputs[inputs.length - 1], { target: { value: 'b' } });
    });
    await act(async () => {
      await fireEvent.keyDown(inputs[inputs.length - 1], { keyCode: 13 });
    });
    expect(updateState).not.toHaveBeenCalled();
    await act(async () => {
      await fireEvent.change(inputs[inputs.length - 1], { target: { value: '1,3' } });
    });
    await act(async () => {
      await fireEvent.keyDown(inputs[inputs.length - 1], { keyCode: 13 });
    });
    expect(updateState).toHaveBeenLastCalledWith(expect.objectContaining({ raw: '1,3' }));
  });
});
