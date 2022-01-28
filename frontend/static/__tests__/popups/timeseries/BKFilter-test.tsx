import { ChartDataset } from 'chart.js';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';

import { default as BKFilter, chartConfigBuilder } from '../../../popups/timeseries/BKFilter';
import {
  BASE_CFGS,
  BaseComponentProps,
  BKConfig,
  TimeseriesAnalysisType,
} from '../../../popups/timeseries/TimeseriesAnalysisState';
import { tickUpdate } from '../../test-utils';

export const updateValue = async (result: ReactWrapper, value: number, inputIdx = 0): Promise<ReactWrapper> => {
  await act(async () => {
    result
      .find('input')
      .at(inputIdx)
      .simulate('change', { target: { value: 5 } });
  });
  result = result.update();
  await act(async () => {
    result.find('input').at(inputIdx).simulate('keyDown', { key: 'Enter' });
  });
  return result.update();
};

describe('BKFilter', () => {
  let wrapper: ReactWrapper;
  let props: BaseComponentProps<BKConfig>;
  const updateState = jest.fn();

  beforeEach(async () => {
    props = {
      cfg: { ...BASE_CFGS[TimeseriesAnalysisType.BKFILTER] },
      updateState,
    };
    wrapper = mount(<BKFilter {...props} />);
    await act(async () => tickUpdate(wrapper));
  });

  afterEach(jest.resetAllMocks);

  it('renders successfully', () => {
    expect(wrapper.find('div.col-md-4')).toHaveLength(3);
    expect(props.updateState).toHaveBeenCalledTimes(1);
  });

  it('updates state', async () => {
    wrapper = await updateValue(wrapper, 5);
    wrapper = await updateValue(wrapper, 5, 1);
    wrapper = await updateValue(wrapper, 5, 2);
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
