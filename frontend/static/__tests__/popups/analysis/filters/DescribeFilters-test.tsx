import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';

import ButtonToggle, { ButtonToggleOption } from '../../../../ButtonToggle';
import { AnalysisType } from '../../../../popups/analysis/ColumnAnalysisState';
import CategoryInputs from '../../../../popups/analysis/filters/CategoryInputs';
import { default as DescribeFilters, DescribeFiltersProps } from '../../../../popups/analysis/filters/DescribeFilters';
import GeoFilters from '../../../../popups/analysis/filters/GeoFilters';
import OrdinalInputs from '../../../../popups/analysis/filters/OrdinalInputs';
import TextEnterFilter from '../../../../popups/analysis/filters/TextEnterFilter';
import { mockColumnDef } from '../../../mocks/MockColumnDef';
import { tickUpdate } from '../../../test-utils';

describe('DescribeFilters tests', () => {
  let result: ReactWrapper;
  let props: DescribeFiltersProps;

  beforeEach(async () => {
    props = {
      selectedCol: 'foo',
      cols: [mockColumnDef({ name: 'foo', dtype: 'str' }), mockColumnDef({ name: 'bar', dtype: 'str', index: 1 })],
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
    };
    result = mount(<DescribeFilters {...props} />);
    await act(async () => await tickUpdate(result));
    result = result.update();
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('calls buildChart', async () => {
    await act(async () => {
      result.find(ButtonToggle).props().update(AnalysisType.VALUE_COUNTS);
    });
    result = result.update();
    jest.resetAllMocks();
    await act(async () => {
      result.find(OrdinalInputs).props().setOrdinalCol({ value: 'bar' });
    });
    await act(async () => {
      result.find(OrdinalInputs).props().setOrdinalAgg({ value: 'mean' });
    });
    expect(props.buildChart).toHaveBeenCalledTimes(2);
  });

  describe('rendering int column', () => {
    it('rendering boxplot', () => {
      expect(result.find(OrdinalInputs)).toHaveLength(0);
      expect(result.find(CategoryInputs)).toHaveLength(0);
      expect(result.find(TextEnterFilter)).toHaveLength(0);
      expect(
        result
          .find(ButtonToggle)
          .props()
          .options.map((option: ButtonToggleOption) => option.value as AnalysisType),
      ).toEqual([AnalysisType.BOXPLOT, AnalysisType.HISTOGRAM, AnalysisType.VALUE_COUNTS, AnalysisType.QQ]);
    });

    it('rendering histogram', async () => {
      await act(async () => {
        result.find(ButtonToggle).first().props().update(AnalysisType.HISTOGRAM);
      });
      result = result.update();
      expect(result.find(OrdinalInputs)).toHaveLength(0);
      expect(result.find(CategoryInputs)).toHaveLength(0);
      expect(result.find(TextEnterFilter)).toHaveLength(1);
      await act(async () => {
        result.find(ButtonToggle).last().props().update(true);
      });
      result = result.update();
      expect(props.buildChart).toHaveBeenLastCalledWith(expect.objectContaining({ density: true }));
    });

    it('rendering value_counts', () => {
      result.find(ButtonToggle).first().find('button').at(2).simulate('click');
      expect(result.find(OrdinalInputs)).toHaveLength(1);
      expect(result.find(CategoryInputs)).toHaveLength(0);
      expect(result.find(TextEnterFilter)).toHaveLength(1);
    });
  });

  describe('rendering float column', () => {
    beforeEach(() => {
      result.setProps({ dtype: 'float64', details: { type: 'float64' } });
      result.update();
    });

    it('rendering boxplot', () => {
      expect(result.find(OrdinalInputs)).toHaveLength(0);
      expect(result.find(CategoryInputs)).toHaveLength(0);
      expect(result.find(TextEnterFilter)).toHaveLength(0);
      expect(
        result
          .find(ButtonToggle)
          .props()
          .options.map((option: ButtonToggleOption) => option.value as AnalysisType),
      ).toEqual([AnalysisType.BOXPLOT, AnalysisType.HISTOGRAM, AnalysisType.CATEGORIES, AnalysisType.QQ]);
    });

    it('rendering histogram', () => {
      result.find(ButtonToggle).first().find('button').at(1).simulate('click');
      expect(result.find(OrdinalInputs)).toHaveLength(0);
      expect(result.find(CategoryInputs)).toHaveLength(0);
      expect(result.find(TextEnterFilter)).toHaveLength(1);
    });

    it('rendering categories', () => {
      result.find(ButtonToggle).first().find('button').at(2).simulate('click');
      expect(result.find(OrdinalInputs)).toHaveLength(0);
      expect(result.find(CategoryInputs)).toHaveLength(1);
      expect(result.find(TextEnterFilter)).toHaveLength(1);
    });
  });

  describe('rendering datetime column', () => {
    beforeEach(() => {
      result.setProps({ dtype: 'datetime[ns]', details: { type: 'datetime' } });
      result.update();
    });

    it('rendering boxplot', () => {
      expect(result.find(OrdinalInputs)).toHaveLength(0);
      expect(result.find(CategoryInputs)).toHaveLength(0);
      expect(result.find(TextEnterFilter)).toHaveLength(0);
      expect(
        result
          .find(ButtonToggle)
          .props()
          .options.map((option: ButtonToggleOption) => option.value as AnalysisType),
      ).toEqual([AnalysisType.BOXPLOT, AnalysisType.HISTOGRAM, AnalysisType.VALUE_COUNTS, AnalysisType.QQ]);
    });

    it('rendering value_counts', () => {
      result.find(ButtonToggle).first().find('button').at(2).simulate('click');
      expect(result.find(OrdinalInputs)).toHaveLength(1);
      expect(result.find(CategoryInputs)).toHaveLength(0);
      expect(result.find(TextEnterFilter)).toHaveLength(1);
    });
  });

  describe('rendering geolocation column', () => {
    beforeEach(() => {
      result.setProps({
        dtype: 'float',
        coord: 'lat',
        details: { type: 'float' },
      });
      result.update();
    });

    it('loading options', () => {
      expect(
        result
          .find(ButtonToggle)
          .props()
          .options.map((option: ButtonToggleOption) => option.value as AnalysisType),
      ).toEqual([AnalysisType.BOXPLOT, AnalysisType.HISTOGRAM, AnalysisType.CATEGORIES, AnalysisType.QQ]);
    });

    it('rendering geolocation', async () => {
      await act(async () => {
        result.find(ButtonToggle).first().props().update(AnalysisType.GEOLOCATION);
      });
      result = result.update();
      expect(result.find(GeoFilters)).toHaveLength(1);
    });
  });

  describe('chart navigation', () => {
    let addEventListenerSpy: jest.SpyInstance;

    beforeEach(() => {
      addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    });

    const move = async (prop: string): Promise<void> => {
      await act(async () => {
        addEventListenerSpy.mock.calls[addEventListenerSpy.mock.calls.length - 1][1]({
          key: prop,
          stopPropagation: jest.fn(),
        });
      });
      result = result.update();
    };

    it('moves selected chart on LEFT', async () => {
      await act(async () => {
        result.find(ButtonToggle).first().props().update(AnalysisType.HISTOGRAM);
      });
      result = result.update();
      await move('ArrowLeft');
      expect(result.find(ButtonToggle).first().props().defaultValue).toBe(AnalysisType.BOXPLOT);
    });

    it('moves selected chart on RIGHT', async () => {
      await move('ArrowRight');
      expect(result.find(ButtonToggle).first().props().defaultValue).toBe(AnalysisType.HISTOGRAM);
    });

    it('does nothing on RIGHT if at last chart', async () => {
      await act(async () => {
        result.find(ButtonToggle).first().props().update(AnalysisType.QQ);
      });
      result = result.update();
      await move('ArrowRight');
      expect(result.find(ButtonToggle).first().props().defaultValue).toBe(AnalysisType.QQ);
    });

    it('does nothing on LEFT if at first chart', async () => {
      await act(async () => {
        result.find(ButtonToggle).first().props().update(AnalysisType.BOXPLOT);
      });
      result = result.update();
      await move('ArrowLeft');
      expect(result.find(ButtonToggle).first().props().defaultValue).toBe(AnalysisType.BOXPLOT);
    });
  });
});
