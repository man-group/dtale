import axios from 'axios';
import { ChartConfiguration } from 'chart.js';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';

import ButtonToggle from '../../../ButtonToggle';
import ChartsBody from '../../../popups/charts/ChartsBody';
import { Checkbox } from '../../../popups/create/LabeledCheckbox';
import BaseInputs, { BaseInputProps } from '../../../popups/timeseries/BaseInputs';
import BKFilter from '../../../popups/timeseries/BKFilter';
import CFFilter from '../../../popups/timeseries/CFFilter';
import HPFilter from '../../../popups/timeseries/HPFilter';
import Reports from '../../../popups/timeseries/Reports';
import SeasonalDecompose, { SeasonalDecomposeProps } from '../../../popups/timeseries/SeasonalDecompose';
import {
  BaseComponentProps,
  BaseTimeseriesConfig,
  BKConfig,
  CFConfig,
  HPConfig,
  SeasonalDecomposeConfig,
  SeasonalDecomposeModel,
  TimeseriesAnalysisType,
} from '../../../popups/timeseries/TimeseriesAnalysisState';
import { ActionType } from '../../../redux/actions/AppActions';
import { RemovableError } from '../../../RemovableError';
import reduxUtils from '../../redux-test-utils';
import { parseUrlParams, tickUpdate } from '../../test-utils';

describe('TimeseriesAnalysis', () => {
  let axiosGetSpy: jest.SpyInstance;
  let wrapper: ReactWrapper;
  const dispatchSpy = jest.fn();

  beforeEach(async () => {
    axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation(async (url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
    const useSelectorSpy = jest.spyOn(redux, 'useSelector');
    useSelectorSpy.mockReturnValue({ dataId: '1', pythonVersion: [3, 8, 0] });
    const useDispatchSpy = jest.spyOn(redux, 'useDispatch');
    useDispatchSpy.mockReturnValue(dispatchSpy);
    wrapper = mount(<Reports />);
    await act(async () => tickUpdate(wrapper));
    wrapper = wrapper.update();
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  const updateType = async (type: TimeseriesAnalysisType): Promise<ReactWrapper> => {
    await act(async () => {
      wrapper.find(ButtonToggle).first().props().update(type);
    });
    return wrapper.update();
  };

  const updateState = async <T, U extends BaseComponentProps<T>>(
    result: ReactWrapper<U, Record<string, any>>,
    cfg: T,
  ): Promise<ReactWrapper> => {
    await act(async () => {
      result.props().updateState?.(cfg);
    });
    return wrapper.update();
  };

  it('renders successfully', () => {
    expect(wrapper.find(BaseInputs)).toHaveLength(1);
    expect(wrapper.find(BaseInputs).props().columns).toHaveLength(4);
    expect(wrapper.find(BaseInputs).props().cfg).toMatchObject({ index: 'col4' });
    expect(wrapper.find(HPFilter)).toHaveLength(1);
  });

  it('builds chart configs successfully', async () => {
    wrapper = await updateState<BaseTimeseriesConfig, BaseInputProps>(wrapper.find(BaseInputs), {
      col: 'foo',
      index: 'date',
    });
    let cfg = wrapper
      .find(ChartsBody)
      .props()
      .configHandler?.({
        data: { datasets: [{}, {}, {}] },
        options: {
          scales: {
            'y-cycle': {},
            'y-trend': {},
            'y-foo': { title: {} },
            x: { title: { display: false } },
          },
          plugins: {},
        },
      } as any as ChartConfiguration);
    expect(cfg).toBeDefined();
    await act(async () => {
      wrapper.find(Checkbox).first().find('i').simulate('click');
    });
    wrapper = wrapper.update();
    cfg = wrapper
      .find(ChartsBody)
      .props()
      .configHandler?.({
        data: { datasets: [{ label: 'foo', data: [] }, {}, {}] },
        options: {
          scales: {
            'y-cycle': {},
            'y-trend': {},
            'y-foo': { title: {} },
            x: { title: { display: false } },
          },
          plugins: {},
        },
      } as any as ChartConfiguration);
    expect(Object.keys(cfg?.options?.scales ?? {})).toEqual(['y-foo', 'x']);
  });

  it('handles mount error', async () => {
    axiosGetSpy.mockImplementation(async (url: string) => Promise.resolve({ data: { error: 'failure' } }));
    wrapper = mount(<Reports />);
    await act(async () => tickUpdate(wrapper));
    expect(wrapper.find(RemovableError).props().error).toBe('failure');
  });

  it('renders report inputs successfully', async () => {
    wrapper = await updateType(TimeseriesAnalysisType.BKFILTER);
    expect(wrapper.find(BKFilter)).toHaveLength(1);
    wrapper = await updateType(TimeseriesAnalysisType.CFFILTER);
    expect(wrapper.find(CFFilter)).toHaveLength(1);
    wrapper = await updateType(TimeseriesAnalysisType.SEASONAL_DECOMPOSE);
    expect(wrapper.find(SeasonalDecompose)).toHaveLength(1);
    wrapper = await updateType(TimeseriesAnalysisType.STL);
    expect(wrapper.find(SeasonalDecompose)).toHaveLength(1);
  });

  it('closes successfully', async () => {
    await act(async () => {
      wrapper.find('button').first().simulate('click');
    });
    wrapper = wrapper.update();
    expect(dispatchSpy).toHaveBeenLastCalledWith({ type: ActionType.HIDE_SIDE_PANEL });
  });

  describe('validate report builder', () => {
    beforeEach(async () => {
      wrapper = await updateState<BaseTimeseriesConfig, BaseInputProps>(wrapper.find(BaseInputs), {
        col: 'col1',
        index: 'index',
      });
    });

    it('bkfilter', async () => {
      wrapper = await updateType(TimeseriesAnalysisType.BKFILTER);
      wrapper = await updateState<BKConfig, BaseComponentProps<BKConfig>>(wrapper.find(BKFilter), {
        low: 6,
        high: 32,
        K: 12,
      });
      expect(wrapper.find('pre').text()).toBeDefined();
      const url = wrapper.find(ChartsBody).props().url;
      expect(url?.startsWith('/dtale/timeseries-analysis/1')).toBe(true);
      const urlParams = parseUrlParams(url);
      expect(urlParams.type).toBe('bkfilter');
    });

    it('hpfilter', async () => {
      wrapper = await updateState<HPConfig, BaseComponentProps<HPConfig>>(wrapper.find(HPFilter), { lamb: 1600 });
      expect(wrapper.find('pre').text()).toBeDefined();
      const urlParams = parseUrlParams(wrapper.find(ChartsBody).props().url);
      expect(urlParams.type).toBe('hpfilter');
    });

    it('cffilter', async () => {
      wrapper = await updateType(TimeseriesAnalysisType.CFFILTER);
      wrapper = await updateState<CFConfig, BaseComponentProps<CFConfig>>(wrapper.find(CFFilter), {
        low: 6,
        high: 32,
        drift: true,
      });
      expect(wrapper.find('pre').text()).toBeDefined();
      const urlParams = parseUrlParams(wrapper.find(ChartsBody).props().url);
      expect(urlParams.type).toBe('cffilter');
    });

    it('seasonal_decompose', async () => {
      wrapper = await updateType(TimeseriesAnalysisType.SEASONAL_DECOMPOSE);
      wrapper = await updateState<SeasonalDecomposeConfig, SeasonalDecomposeProps>(wrapper.find(SeasonalDecompose), {
        model: SeasonalDecomposeModel.ADDITIVE,
      });
      expect(wrapper.find('pre').text()).toBeDefined();
      const urlParams = parseUrlParams(wrapper.find(ChartsBody).props().url);
      expect(urlParams.type).toBe('seasonal_decompose');
    });

    it('stl', async () => {
      wrapper = await updateType(TimeseriesAnalysisType.STL);
      wrapper = await updateState<SeasonalDecomposeConfig, SeasonalDecomposeProps>(
        wrapper.find(SeasonalDecompose),
        {} as SeasonalDecomposeConfig,
      );
      expect(wrapper.find('pre').text()).toBeDefined();
      const urlParams = parseUrlParams(wrapper.find(ChartsBody).props().url);
      expect(urlParams.type).toBe('stl');
    });
  });

  describe('report errors', () => {
    beforeEach(async () => {
      wrapper = await updateState<BaseTimeseriesConfig, BaseInputProps>(wrapper.find(BaseInputs), {});
      expect(wrapper.find(RemovableError).props().error).toBe('Missing an index selection!');
      wrapper = await updateState<BaseTimeseriesConfig, BaseInputProps>(wrapper.find(BaseInputs), { index: 'index' });
      expect(wrapper.find(RemovableError).props().error).toBe('Missing a column selection!');
      wrapper = await updateState<BaseTimeseriesConfig, BaseInputProps>(wrapper.find(BaseInputs), {
        col: 'col1',
        index: 'index',
      });
    });

    it('bkfilter', async () => {
      wrapper = await updateType(TimeseriesAnalysisType.BKFILTER);
      wrapper = await updateState<BKConfig, BaseComponentProps<BKConfig>>(wrapper.find(BKFilter), {} as BKConfig);
      expect(wrapper.find(RemovableError).props().error).toBe('Please enter a low!');
      wrapper = await updateState<BKConfig, BaseComponentProps<BKConfig>>(wrapper.find(BKFilter), {
        low: 6,
      } as BKConfig);
      expect(wrapper.find(RemovableError).props().error).toBe('Please enter a high!');
      wrapper = await updateState<BKConfig, BaseComponentProps<BKConfig>>(wrapper.find(BKFilter), {
        low: 6,
        high: 32,
      } as BKConfig);
      expect(wrapper.find(RemovableError).props().error).toBe('Please enter K!');
    });

    it('hpfilter', async () => {
      wrapper = await updateState<HPConfig, BaseComponentProps<HPConfig>>(wrapper.find(HPFilter), {} as HPConfig);
      expect(wrapper.find(RemovableError).props().error).toBe('Please enter a lambda!');
    });

    it('cffilter', async () => {
      wrapper = await updateType(TimeseriesAnalysisType.CFFILTER);
      wrapper = await updateState<CFConfig, BaseComponentProps<CFConfig>>(wrapper.find(CFFilter), {} as CFConfig);
      expect(wrapper.find(RemovableError).props().error).toBe('Please enter a low!');
      wrapper = await updateState<CFConfig, BaseComponentProps<CFConfig>>(wrapper.find(CFFilter), {
        low: 6,
      } as CFConfig);
      expect(wrapper.find(RemovableError).props().error).toBe('Please enter a high!');
    });
  });
});
