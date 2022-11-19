import { act, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';

import { AnalysisType } from '../../../../popups/analysis/ColumnAnalysisState';
import { default as DescribeFilters, DescribeFiltersProps } from '../../../../popups/analysis/filters/DescribeFilters';
import { mockColumnDef } from '../../../mocks/MockColumnDef';
import { selectOption } from '../../../test-utils';

describe('DescribeFilters tests', () => {
  let result: Element;
  let props: DescribeFiltersProps;

  const buildMock = async (overrides?: Partial<DescribeFiltersProps>): Promise<void> => {
    props = {
      selectedCol: 'foo',
      cols: [
        mockColumnDef({ name: 'foo', dtype: 'str' }),
        mockColumnDef({ name: 'bar', dtype: 'str', index: 1 }),
        mockColumnDef({ name: 'baz', dtype: 'int', index: 2 }),
      ],
      dtype: 'int64',
      code: 'test code',
      type: AnalysisType.BOXPLOT,
      top: 100,
      buildChart: jest.fn(),
      details: {
        describe: {},
        uniques: { data: [] },
        dtype_counts: [],
        sequential_diffs: { diffs: { data: [] }, min: '', max: '', avg: '' },
        string_metrics: {},
      },
      ...overrides,
    };
    result = render(<DescribeFilters {...props} />).container;
  };

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('calls buildChart', async () => {
    await buildMock();
    await act(async () => {
      await fireEvent.click(screen.getByText('Value Counts'));
    });
    jest.resetAllMocks();
    await selectOption(screen.getByTestId('ordinal-col').querySelector('.Select')!, 'baz');
    await selectOption(screen.getByTestId('ordinal-agg').querySelector('.Select')!, 'Mean');
    expect(props.buildChart).toHaveBeenCalledTimes(2);
  });

  describe('rendering int column', () => {
    beforeEach(async () => await buildMock());

    it('rendering boxplot', () => {
      expect(screen.queryAllByTestId('ordinal-col')).toHaveLength(0);
      expect(screen.queryAllByTestId('category-col')).toHaveLength(0);
      expect(screen.queryAllByTestId('value-input')).toHaveLength(0);
      expect(Array.from(result.getElementsByTagName('button')).map((b) => b.textContent)).toEqual([
        'Describe',
        'Histogram',
        'Value Counts',
        'Q-Q Plot',
      ]);
    });

    it('rendering histogram', async () => {
      await act(async () => {
        await fireEvent.click(screen.getByText('Histogram'));
      });
      expect(screen.queryAllByTestId('ordinal-col')).toHaveLength(0);
      expect(screen.queryAllByTestId('category-col')).toHaveLength(0);
      expect(screen.getByTestId('value-input')).toBeDefined();
      await act(async () => {
        await fireEvent.click(screen.getByText('Probability'));
      });
      expect(props.buildChart).toHaveBeenLastCalledWith(expect.objectContaining({ density: true }));
    });

    it('rendering value_counts', async () => {
      await act(async () => {
        await fireEvent.click(screen.getByText('Value Counts'));
      });
      expect(screen.getByTestId('ordinal-col')).toBeDefined();
      expect(screen.queryAllByTestId('category-col')).toHaveLength(0);
      expect(screen.getByTestId('value-input')).toBeDefined();
    });
  });

  describe('rendering float column', () => {
    beforeEach(async () => await buildMock({ dtype: 'float64' }));

    it('rendering boxplot', () => {
      expect(screen.queryAllByTestId('ordinal-col')).toHaveLength(0);
      expect(screen.queryAllByTestId('category-col')).toHaveLength(0);
      expect(screen.queryAllByTestId('value-input')).toHaveLength(0);
      expect(Array.from(result.getElementsByTagName('button')).map((b) => b.textContent)).toEqual([
        'Describe',
        'Histogram',
        'Categories',
        'Q-Q Plot',
      ]);
    });

    it('rendering histogram', async () => {
      await act(async () => {
        await fireEvent.click(screen.getByText('Histogram'));
      });
      expect(screen.queryAllByTestId('ordinal-col')).toHaveLength(0);
      expect(screen.queryAllByTestId('category-col')).toHaveLength(0);
      expect(screen.getByTestId('value-input')).toBeDefined();
    });

    it('rendering categories', async () => {
      await act(async () => {
        await fireEvent.click(screen.getByText('Categories'));
      });
      expect(screen.queryAllByTestId('ordinal-col')).toHaveLength(0);
      expect(screen.getByTestId('category-col')).toBeDefined();
      expect(screen.getByTestId('value-input')).toBeDefined();
    });
  });

  describe('rendering datetime column', () => {
    beforeEach(async () => await buildMock({ dtype: 'datetime[ns]' }));

    it('rendering boxplot', () => {
      expect(screen.queryAllByTestId('ordinal-col')).toHaveLength(0);
      expect(screen.queryAllByTestId('category-col')).toHaveLength(0);
      expect(screen.queryAllByTestId('value-input')).toHaveLength(0);
      expect(Array.from(result.getElementsByTagName('button')).map((b) => b.textContent)).toEqual([
        'Describe',
        'Histogram',
        'Value Counts',
        'Q-Q Plot',
      ]);
    });

    it('rendering value_counts', async () => {
      await act(async () => {
        await fireEvent.click(screen.getByText('Value Counts'));
      });
      expect(screen.getByTestId('ordinal-col')).toBeDefined();
      expect(screen.queryAllByTestId('category-col')).toHaveLength(0);
      expect(screen.getByTestId('value-input')).toBeDefined();
    });
  });

  describe('rendering geolocation column', () => {
    beforeEach(
      async () =>
        await buildMock({
          dtype: 'float',
          selectedCol: 'lat',
          cols: [
            mockColumnDef({ name: 'lat', dtype: 'float', coord: 'lat' }),
            mockColumnDef({ name: 'lon', dtype: 'float', coord: 'lon', index: 1 }),
          ],
        }),
    );

    it('loading options', () => {
      expect(Array.from(result.getElementsByTagName('button')).map((b) => b.textContent)).toEqual([
        'Describe',
        'Histogram',
        'Categories',
        'Geolocation',
        'Q-Q Plot',
      ]);
    });

    it('rendering geolocation', async () => {
      await act(async () => {
        await fireEvent.click(screen.getByText('Geolocation'));
      });
      expect(screen.getByText('Latitude:')).toBeDefined();
    });
  });

  describe('chart navigation', () => {
    let addEventListenerSpy: jest.SpyInstance;

    beforeEach(async () => {
      await buildMock();
      addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    });

    const move = async (prop: string): Promise<void> => {
      await act(async () => {
        await addEventListenerSpy.mock.calls[addEventListenerSpy.mock.calls.length - 1][1]({
          key: prop,
          stopPropagation: jest.fn(),
        });
      });
    };

    it('moves selected chart on LEFT', async () => {
      await act(async () => {
        await fireEvent.click(screen.getByText('Histogram'));
      });
      await move('ArrowLeft');
      expect(result.querySelector('button.active')!.textContent).toBe('Describe');
    });

    it('moves selected chart on RIGHT', async () => {
      await move('ArrowRight');
      expect(result.querySelector('button.active')!.textContent).toBe('Histogram');
    });

    it('does nothing on RIGHT if at last chart', async () => {
      await act(async () => {
        await fireEvent.click(screen.getByText('Q-Q Plot'));
      });
      await move('ArrowRight');
      expect(result.querySelector('button.active')!.textContent).toBe('Q-Q Plot');
    });

    it('does nothing on LEFT if at first chart', async () => {
      await act(async () => {
        await fireEvent.click(screen.getByText('Describe'));
      });
      await move('ArrowLeft');
      expect(result.querySelector('button.active')!.textContent).toBe('Describe');
    });
  });
});
