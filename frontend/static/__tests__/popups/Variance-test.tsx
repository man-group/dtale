import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';

import * as chartUtils from '../../chartUtils';
import TextEnterFilter from '../../popups/analysis/filters/TextEnterFilter';
import { Variance } from '../../popups/variance/Variance';
import { RemovableError } from '../../RemovableError';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, CreateChartSpy, getLastChart, mockChartJS, tickUpdate } from '../test-utils';

import { ANALYSIS_DATA } from './ColumnAnalysis.test.support';

const VARIANCE_DATA = {
  check1: {
    result: true,
    size: 21613,
    unique: 13,
  },
  check2: {
    result: false,
    val1: {
      ct: 9805,
      val: 3,
    },
    val2: {
      ct: 6871,
      val: 4,
    },
  },
  jarqueBera: {
    pvalue: 0.0,
    statistic: 2035067.5022880917,
  },
  missingCt: 0,
  outlierCt: 579,
  shapiroWilk: {
    pvalue: 0.0,
    statistic: 0.8514108657836914,
  },
  size: 21613,
};

const props = {
  dataId: '1',
  chartData: {
    visible: true,
    type: 'variance',
    selectedCol: 'bar',
  },
};

describe('Variance tests', () => {
  let result: ReactWrapper;
  let createChartSpy: CreateChartSpy;

  beforeAll(mockChartJS);

  const updateProps = async (newProps: any): Promise<void> => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    store.getState().dataId = props.dataId;
    result = mount(
      <Provider store={store}>
        <Variance {...newProps} />
      </Provider>,
      {
        attachTo: document.getElementById('content') ?? undefined,
      },
    );
    await tickUpdate(result);
  };

  beforeEach(async () => {
    createChartSpy = jest.spyOn(chartUtils, 'createChart');
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => {
      if (url.startsWith('/dtale/variance')) {
        const col = new URLSearchParams(url.split('?')[1]).get('col');
        if (col === 'error') {
          return Promise.resolve({ data: { error: 'variance error' } });
        }
        if (col === 'lowVariance') {
          return Promise.resolve({
            data: {
              ...VARIANCE_DATA,
              check2: { ...VARIANCE_DATA.check2, result: true },
            },
          });
        }
        return Promise.resolve({ data: { ...VARIANCE_DATA } });
      } else if (url.startsWith('/dtale/column-analysis')) {
        return Promise.resolve({
          data: {
            ...ANALYSIS_DATA,
            dtype: 'int64',
            chart_type: 'histogram',
            timestamp: new Date().getTime(),
          },
        });
      }
      return Promise.resolve({ data: undefined });
    });
  });

  afterEach(jest.restoreAllMocks);

  const input = (): ReactWrapper => result.find('input');

  it('Variance rendering variance report', async () => {
    await updateProps(props);
    expect(result.find('h1').text()).toBe(`Based on checks 1 & 2 "bar" does not have Low Variance`);
    await updateProps({
      chartData: { visible: true, selectedCol: 'lowVariance' },
    });
    expect(result.find('h1').text()).toBe(`Based on checks 1 & 2 "lowVariance" has Low Variance`);
  });

  it('Variance rendering histogram', async () => {
    await updateProps(props);
    await act(async () => await tickUpdate(result));
    result = result.update();
    expect(input().prop('value')).toBe('20');
    expect(getLastChart(createChartSpy).type).toBe('bar');
    expect(getLastChart(createChartSpy).options?.scales?.x).toEqual({ title: { display: true, text: 'Bin' } });
    input().simulate('change', { target: { value: '' } });
    input().simulate('keyDown', { key: 'Shift' });
    input().simulate('keyDown', { key: 'Enter' });
    input().simulate('change', { target: { value: 'a' } });
    input().simulate('keyDown', { key: 'Enter' });
    input().simulate('change', { target: { value: '50' } });
    input().simulate('keyDown', { key: 'Enter' });
    await tickUpdate(result);
    expect(result.find(TextEnterFilter).find('input').props().value).toBe('50');
  });

  it('Variance error', async () => {
    await updateProps({
      ...props,
      chartData: { ...props.chartData, selectedCol: 'error' },
    });
    expect(result.find(RemovableError).text()).toBe('variance error');
  });
});
