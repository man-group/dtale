import { act, render, screen } from '@testing-library/react';
import * as React from 'react';
import selectEvent from 'react-select-event';

import { ColumnType } from '../../../../dtale/gridUtils';
import { AnalysisType } from '../../../../popups/analysis/ColumnAnalysisState';
import { default as OrdinalInputs, OrdinalInputsProps } from '../../../../popups/analysis/filters/OrdinalInputs';
import { mockColumnDef } from '../../../mocks/MockColumnDef';
import { selectOption } from '../../../test-utils';

describe('OrdinalInputs tests', () => {
  let result: Element;
  let props: OrdinalInputsProps;

  const buildMock = (overrides?: Partial<OrdinalInputsProps>): void => {
    props = {
      selectedCol: 'foo',
      cols: [mockColumnDef({ name: 'foo', dtype: 'str' }), mockColumnDef({ name: 'bar', dtype: 'int' })],
      type: AnalysisType.WORD_VALUE_COUNTS,
      colType: ColumnType.STRING,
      setOrdinalCol: jest.fn(),
      setOrdinalAgg: jest.fn(),
      setCleaners: jest.fn(),
      ...overrides,
    };
    result = render(<OrdinalInputs {...props} />).container;
  };

  afterEach(jest.resetAllMocks);

  it('calls updateOrdinal', async () => {
    buildMock();
    await selectOption(screen.getByTestId('ordinal-col').querySelector('.Select')! as HTMLElement, 'bar');
    await selectOption(screen.getByTestId('ordinal-agg').querySelector('.Select')! as HTMLElement, 'Mean');
    expect(props.setOrdinalCol).toHaveBeenCalled();
    expect(props.setOrdinalCol).toHaveBeenCalledWith({ value: 'bar' });
    expect(props.setOrdinalAgg).toHaveBeenCalledWith({ value: 'mean', label: 'Mean' });
  });

  it('renders no options message', async () => {
    buildMock({ cols: [] });
    const colSelect = screen.getByTestId('ordinal-col').querySelector('.Select')! as HTMLElement;
    await act(async () => {
      await selectEvent.openMenu(colSelect);
    });
    expect(screen.getByText('No columns found')).toBeDefined();
  });

  it('renders cleaners on word_value_counts', async () => {
    buildMock();
    const cleanerSelect = result.querySelector('.cleaner-dd')!.querySelector('.Select')! as HTMLElement;
    await act(async () => {
      await selectEvent.openMenu(cleanerSelect);
    });
    const cleaners = cleanerSelect.getElementsByClassName('Select__option');
    expect(cleaners).toHaveLength(11);
    expect(cleaners[0].textContent).toBe('Replace underscores w/ space');
  });

  it('does not render cleaners for int column', () => {
    buildMock({ colType: ColumnType.INT });
    expect(result.querySelectorAll('div.row')).toHaveLength(1);
  });
});
