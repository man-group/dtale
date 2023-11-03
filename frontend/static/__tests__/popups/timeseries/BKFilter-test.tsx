import { act, fireEvent, render } from '@testing-library/react';
import { ChartDataset } from 'chart.js';
import * as React from 'react';

import { default as BKFilter, chartConfigBuilder } from '../../../popups/timeseries/BKFilter';
import {
  BASE_CFGS,
  BaseComponentProps,
  BKConfig,
  TimeseriesAnalysisType,
} from '../../../popups/timeseries/TimeseriesAnalysisState';

export const updateValue = async (result: Element, value: number, inputIdx = 0): Promise<void> => {
  await act(async () => {
    await fireEvent.change(result.getElementsByTagName('input')[inputIdx], { target: { value } });
  });
  await act(async () => {
    await fireEvent.keyDown(result.getElementsByTagName('input')[inputIdx], { key: 'Enter' });
  });
};

describe('BKFilter', () => {
  let wrapper: Element;
  let props: BaseComponentProps<BKConfig>;
  const updateState = jest.fn();

  beforeEach(async () => {
    props = {
      cfg: { ...BASE_CFGS[TimeseriesAnalysisType.BKFILTER] },
      updateState,
    };
    wrapper = await act(async () => await render(<BKFilter {...props} />).container);
  });

  afterEach(jest.resetAllMocks);

  it('renders successfully', () => {
    expect(wrapper.querySelectorAll('div.col-md-4')).toHaveLength(3);
    expect(props.updateState).toHaveBeenCalledTimes(1);
  });

  it('updates state', async () => {
    await updateValue(wrapper, 5);
    await updateValue(wrapper, 5, 1);
    await updateValue(wrapper, 5, 2);
    expect(props.updateState).toHaveBeenLastCalledWith({ low: 5, high: 5, K: 5 });
  });

  it('builds chart config correctly', () => {
    const cfg = chartConfigBuilder(
      { col: 'foo' },
      {
        data: { datasets: [{} as ChartDataset<'line'>, {} as ChartDataset<'line'>] },
        options: {
          scales: {
            'y-cycle': {},
            'y-foo': {},
            x: { title: { display: false } },
          },
          plugins: {},
        },
      },
    );
    expect(cfg.options?.scales?.['y-foo']?.position).toBe('left');
    expect(cfg.options?.scales?.['y-cycle']?.position).toBe('right');
    expect(cfg.options?.plugins?.legend?.display).toBe(true);
  });
});
