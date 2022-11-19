import { act, fireEvent, render } from '@testing-library/react';
import { ChartDataset } from 'chart.js';
import * as React from 'react';

import { default as CFFilter, chartConfigBuilder } from '../../../popups/timeseries/CFFilter';
import {
  BASE_CFGS,
  BaseComponentProps,
  CFConfig,
  TimeseriesAnalysisType,
} from '../../../popups/timeseries/TimeseriesAnalysisState';

import { updateValue } from './BKFilter-test';

describe('CFFilter', () => {
  let wrapper: Element;
  let props: BaseComponentProps<CFConfig>;
  const updateState = jest.fn();

  beforeEach(async () => {
    props = {
      cfg: { ...BASE_CFGS[TimeseriesAnalysisType.CFFILTER] },
      updateState,
    };
    wrapper = await act(async () => await render(<CFFilter {...props} />).container);
  });

  it('renders successfully', () => {
    expect(wrapper.querySelectorAll('div.col-md-4')).toHaveLength(3);
    expect(props.updateState).toHaveBeenCalledTimes(1);
  });

  it('updates state', async () => {
    await updateValue(wrapper, 5);
    await updateValue(wrapper, 5, 1);
    await act(async () => {
      await fireEvent.click(wrapper.getElementsByTagName('i')[0]);
    });
    expect(props.updateState).toHaveBeenLastCalledWith({ low: 5, high: 5, drift: false });
  });

  it('builds chart config correctly', () => {
    const cfg = chartConfigBuilder(
      { col: 'foo' },
      {
        data: { datasets: [{} as ChartDataset<'line'>, {} as ChartDataset<'line'>, {} as ChartDataset<'line'>] },
        options: {
          scales: {
            'y-cycle': {},
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
    expect(cfg.options?.scales?.['y-cycle']?.position).toBe('right');
    expect(cfg.options?.scales?.['y-trend']?.display).toBe(false);
    expect(cfg.options?.plugins?.legend?.display).toBe(true);
  });
});
