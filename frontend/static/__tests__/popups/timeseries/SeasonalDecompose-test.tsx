import { ChartDataset } from 'chart.js';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';

import {
  chartConfigBuilder,
  default as SeasonalDecompose,
  SeasonalDecomposeProps,
} from '../../../popups/timeseries/SeasonalDecompose';
import {
  BASE_CFGS,
  SeasonalDecomposeModel,
  TimeseriesAnalysisType,
} from '../../../popups/timeseries/TimeseriesAnalysisState';
import { tickUpdate } from '../../test-utils';

describe('SeasonalDecompose', () => {
  let wrapper: ReactWrapper;
  let props: SeasonalDecomposeProps;
  const updateState = jest.fn();

  beforeEach(async () => {
    props = {
      cfg: { ...BASE_CFGS[TimeseriesAnalysisType.SEASONAL_DECOMPOSE] },
      type: TimeseriesAnalysisType.SEASONAL_DECOMPOSE,
      updateState,
    };
    wrapper = mount(<SeasonalDecompose {...props} />);
    await act(async () => tickUpdate(wrapper));
  });

  it('renders successfully', () => {
    expect(wrapper.find('div.col-md-4')).toHaveLength(1);
    expect(props.updateState).toHaveBeenLastCalledWith({ model: SeasonalDecomposeModel.ADDITIVE });
  });

  it('updates state', async () => {
    await act(async () => {
      wrapper.find('button').last().simulate('click');
    });
    wrapper = wrapper.update();
    expect(props.updateState).toHaveBeenLastCalledWith({ model: SeasonalDecomposeModel.MULTIPLICATIVE });
  });

  it('builds chart config correctly', () => {
    const cfg = chartConfigBuilder(
      { col: 'foo' },
      {
        data: {
          datasets: [
            {} as ChartDataset<'line'>,
            {} as ChartDataset<'line'>,
            {} as ChartDataset<'line'>,
            {} as ChartDataset<'line'>,
          ],
        },
        options: {
          scales: {
            'y-cycle': {},
            'y-seasonal': { title: {} },
            'y-resid': {},
            'y-trend': {},
            'y-foo': { title: {} },
            x: { title: { display: false } },
          },
          plugins: {},
        },
      },
    );
    expect(cfg.options?.scales?.['y-foo']?.position).toBe('left');
    expect(cfg.options?.scales?.['y-foo']?.title?.text).toBe('foo, trend');
    expect(cfg.options?.scales?.['y-seasonal']?.title?.text).toBe('seasonal, resid');
    expect(cfg.options?.scales?.['y-seasonal']?.position).toBe('right');
    expect(cfg.options?.scales?.['y-trend']?.display).toBe(false);
    expect(cfg.options?.scales?.['y-resid']?.display).toBe(false);
    expect(cfg.options?.plugins?.legend?.display).toBe(true);
  });

  describe('stl', () => {
    beforeEach(() => {
      jest.resetAllMocks();
      wrapper.setProps({ type: TimeseriesAnalysisType.STL });
    });

    it('renders successfully', () => {
      expect(wrapper.find('div.col-md-4')).toHaveLength(0);
      expect(props.updateState).toHaveBeenCalledTimes(0);
    });
  });
});
