import { act, render } from '@testing-library/react';
import { ChartDataset } from 'chart.js';
import * as React from 'react';

import { chartConfigBuilder, default as HPFilter } from '../../../popups/timeseries/HPFilter';
import {
  BASE_CFGS,
  BaseComponentProps,
  HPConfig,
  TimeseriesAnalysisType,
} from '../../../popups/timeseries/TimeseriesAnalysisState';

import { updateValue } from './BKFilter-test';

describe('HPFilter', () => {
  let wrapper: Element;
  let props: BaseComponentProps<HPConfig>;
  const updateState = jest.fn();

  beforeEach(async () => {
    props = {
      cfg: { ...BASE_CFGS[TimeseriesAnalysisType.HPFILTER] },
      updateState,
    };
    wrapper = await act(async () => await render(<HPFilter {...props} />).container);
  });

  it('updates state', async () => {
    await updateValue(wrapper, 5);
    expect(props.updateState).toHaveBeenLastCalledWith({ lamb: 5 });
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
