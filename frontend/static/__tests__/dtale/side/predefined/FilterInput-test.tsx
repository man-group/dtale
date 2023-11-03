import { act, fireEvent, render, RenderResult, screen } from '@testing-library/react';
import * as React from 'react';
import selectEvent from 'react-select-event';

import { default as FilterInput, FilterInputProps } from '../../../../dtale/side/predefined_filters/FilterInput';
import { PredefinedFilter, PredfinedFilterInputType } from '../../../../redux/state/AppState';
import * as ColumnFilterRepository from '../../../../repository/ColumnFilterRepository';
import reduxUtils from '../../../redux-test-utils';
import { selectOption } from '../../../test-utils';

describe('FilterInput', () => {
  let wrapper: RenderResult;
  let props: FilterInputProps;
  let loadFilterDataSpy: jest.SpyInstance;

  const inputFilter: PredefinedFilter = {
    name: 'custom_foo1',
    description: 'custom_foo1 description',
    column: 'col1',
    inputType: PredfinedFilterInputType.INPUT,
    active: false,
  };
  const selectFilter: PredefinedFilter = {
    name: 'custom_foo2',
    description: 'custom_foo2 description',
    column: 'col1',
    inputType: PredfinedFilterInputType.SELECT,
    active: false,
  };
  const multiselectFilter: PredefinedFilter = {
    name: 'custom_foo3',
    description: 'custom_foo3 description',
    column: 'col1',
    inputType: PredfinedFilterInputType.MULTISELECT,
    active: false,
  };

  beforeEach(() => {
    loadFilterDataSpy = jest.spyOn(ColumnFilterRepository, 'loadFilterData');
    props = {
      dataId: '1',
      filter: inputFilter,
      value: { value: '1', active: true },
      columns: reduxUtils.DTYPES.dtypes,
      save: jest.fn(),
    };
    wrapper = render(<FilterInput {...props} />);
  });

  const buildMock = async (overrides?: Record<string, any>): Promise<void> => {
    props = {
      dataId: '1',
      filter: inputFilter,
      value: { value: '1', active: true },
      columns: reduxUtils.DTYPES.dtypes,
      save: jest.fn(),
      ...overrides,
    };
    wrapper = await act(async (): Promise<RenderResult> => render(<FilterInput {...props} />));
  };

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('handle input-style filters', async () => {
    await buildMock();
    await act(async () => await fireEvent.click(screen.queryAllByText('Edit')[1]));
    expect(wrapper.container.getElementsByTagName('input')).toHaveLength(1);
    await act(async () => await fireEvent.click(screen.getByText('Cancel')));
    expect(wrapper.container.getElementsByTagName('input')).toHaveLength(0);
    await act(async () => await fireEvent.click(screen.queryAllByText('Edit')[1]));
    expect(wrapper.container.getElementsByTagName('input')).toHaveLength(1);
    await act(
      async () =>
        await fireEvent.change(wrapper.container.getElementsByTagName('input')[0], { target: { value: '2' } }),
    );
    await act(async () => await fireEvent.click(screen.getByText('Save')));
    expect(props.save).toHaveBeenCalledWith(inputFilter.name, 2, true);
    expect(loadFilterDataSpy).not.toHaveBeenCalled();
  });

  it('handles enabling/disabling filters', async () => {
    await buildMock();
    await act(async () => await fireEvent.click(screen.queryAllByText('Edit')[1]));
    await act(async () => await fireEvent.click(screen.queryAllByText('Disabled')[1]));
    expect(props.save).toHaveBeenCalledWith(inputFilter.name, '1', false);
    await act(async () => await fireEvent.click(screen.queryAllByText('Enabled')[1]));
    expect(props.save).toHaveBeenCalledWith(inputFilter.name, '1', true);
  });

  it('handle input-style filter parsing error', async () => {
    await buildMock();
    await act(async () => await fireEvent.click(screen.queryAllByText('Edit')[1]));
    expect(wrapper.container.getElementsByTagName('input')).toHaveLength(1);
    await act(
      async () =>
        await fireEvent.change(wrapper.container.getElementsByTagName('input')[0], { target: { value: 'a' } }),
    );
    await act(async () => await fireEvent.click(screen.getByText('Save')));
    expect(props.save).not.toHaveBeenCalled();
    expect(wrapper.container.getElementsByClassName('predefined-filter-errors')[0].textContent).toBe(
      'Invalid integer, a!',
    );
  });

  it('handle input-style float filter', async () => {
    await buildMock({
      columns: [{ ...reduxUtils.DTYPES.dtypes[0], dtype: 'float64' }],
    });
    await act(async () => await fireEvent.click(screen.queryAllByText('Edit')[1]));
    expect(wrapper.container.getElementsByTagName('input')).toHaveLength(1);
    await act(
      async () =>
        await fireEvent.change(wrapper.container.getElementsByTagName('input')[0], { target: { value: 'a' } }),
    );
    await act(async () => await fireEvent.click(screen.getByText('Save')));
    expect(props.save).not.toHaveBeenCalled();
    expect(wrapper.container.getElementsByClassName('predefined-filter-errors')[0].textContent).toBe(
      'Invalid float, a!',
    );

    await act(
      async () =>
        await fireEvent.change(wrapper.container.getElementsByTagName('input')[0], { target: { value: '1.1' } }),
    );
    await act(async () => await fireEvent.click(screen.getByText('Save')));
    expect(props.save).toHaveBeenCalledWith(inputFilter.name, 1.1, true);
    expect(loadFilterDataSpy).not.toHaveBeenCalled();
  });

  it('handle input-style string filter', async () => {
    await buildMock({
      columns: [{ ...reduxUtils.DTYPES.dtypes[0], dtype: 'str' }],
    });
    await act(async () => await fireEvent.click(screen.queryAllByText('Edit')[1]));
    await act(
      async () =>
        await fireEvent.change(wrapper.container.getElementsByTagName('input')[0], { target: { value: 'a' } }),
    );
    await act(async () => await fireEvent.click(screen.getByText('Save')));
    expect(props.save).toHaveBeenCalledWith(inputFilter.name, 'a', true);
    expect(loadFilterDataSpy).not.toHaveBeenCalled();
  });

  it('handle select-style filters', async () => {
    loadFilterDataSpy.mockResolvedValue({ uniques: [1, 2, 3], success: true });
    await buildMock({
      filter: selectFilter,
      value: { value: 1, active: true },
    });
    await act(async () => await fireEvent.click(screen.queryAllByText('Edit')[1]));
    expect(wrapper.container.getElementsByClassName('Select')).toHaveLength(1);
    await selectOption(wrapper.container.getElementsByClassName('Select')[0] as HTMLElement, '2');
    await act(async () => await fireEvent.click(screen.getByText('Save')));
    expect(props.save).toHaveBeenCalledWith(selectFilter.name, 2, true);
    expect(loadFilterDataSpy).toHaveBeenCalledTimes(1);
    expect(loadFilterDataSpy).toHaveBeenLastCalledWith('1', 'col1');
  });

  it('handle multiselect-style filters', async () => {
    loadFilterDataSpy.mockResolvedValue({ uniques: [1, 2, 3], success: true });
    await buildMock({
      filter: multiselectFilter,
      value: { value: [1, 2], active: true },
    });
    await act(async () => await fireEvent.click(screen.queryAllByText('Edit')[1]));
    expect(wrapper.container.getElementsByClassName('Select')).toHaveLength(1);
    const select = wrapper.container.getElementsByClassName('Select')[0] as HTMLElement;
    await act(async () => {
      await selectEvent.clearFirst(select);
    });
    await selectOption(select, ['2', '3']);
    await act(async () => await fireEvent.click(screen.getByText('Save')));
    expect(props.save).toHaveBeenCalledWith(multiselectFilter.name, [2, 3], true);
    expect(loadFilterDataSpy).toHaveBeenCalledTimes(1);
  });
});
