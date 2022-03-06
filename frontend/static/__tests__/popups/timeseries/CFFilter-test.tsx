import { ChartDataset } from 'chart.js';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';

import { default as CFFilter, chartConfigBuilder } from '../../../popups/timeseries/CFFilter';
import {
  BASE_CFGS,
  BaseComponentProps,
  CFConfig,
  TimeseriesAnalysisType,
} from '../../../popups/timeseries/TimeseriesAnalysisState';
import { tickUpdate } from '../../test-utils';

import { updateValue } from './BKFilter-test';

describe('CFFilter', () => {
  let wrapper: ReactWrapper;
  let props: BaseComponentProps<CFConfig>;
  const updateState = jest.fn();

  beforeEach(async () => {
    props = {
      cfg: { ...BASE_CFGS[TimeseriesAnalysisType.CFFILTER] },
      updateState,
    };
    wrapper = mount(<CFFilter {...props} />);
    await act(async () => tickUpdate(wrapper));
  });

  it('renders successfully', () => {
    expect(wrapper.find('div.col-md-4')).toHaveLength(3);
    expect(props.updateState).toHaveBeenCalledTimes(1);
  });

  it('updates state', async () => {
    wrapper = await updateValue(wrapper, 5);
    wrapper = await updateValue(wrapper, 5, 1);
    await act(async () => {
      wrapper.find('i').simulate('click');
    });
    wrapper = wrapper.update();
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
