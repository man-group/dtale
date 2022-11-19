import { act, fireEvent, render, screen } from '@testing-library/react';
import { ChartDataset } from 'chart.js';
import * as React from 'react';

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

describe('SeasonalDecompose', () => {
  let wrapper: Element;
  let props: SeasonalDecomposeProps;
  const updateState = jest.fn();

  const buildMock = async (overrides?: Partial<SeasonalDecomposeProps>): Promise<void> => {
    props = {
      cfg: { ...BASE_CFGS[TimeseriesAnalysisType.SEASONAL_DECOMPOSE] },
      type: TimeseriesAnalysisType.SEASONAL_DECOMPOSE,
      updateState,
      ...overrides,
    };
    wrapper = await act(async () => await render(<SeasonalDecompose {...props} />).container);
  };

  it('renders successfully', async () => {
    await buildMock();
    expect(wrapper.querySelectorAll('div.col-md-4')).toHaveLength(1);
    expect(props.updateState).toHaveBeenLastCalledWith({ model: SeasonalDecomposeModel.ADDITIVE });
  });

  it('updates state', async () => {
    await buildMock();
    await act(async () => {
      await fireEvent.click(screen.getByText('multiplicative'));
    });
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
    beforeEach(async () => {
      jest.resetAllMocks();
      await buildMock({ type: TimeseriesAnalysisType.STL });
    });

    it('renders successfully', () => {
      expect(wrapper.querySelectorAll('div.col-md-4')).toHaveLength(0);
      expect(props.updateState).toHaveBeenLastCalledWith({ model: SeasonalDecomposeModel.ADDITIVE });
    });
  });
});
