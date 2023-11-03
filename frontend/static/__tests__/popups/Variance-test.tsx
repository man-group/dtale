import { act, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';

import * as chartUtils from '../../chartUtils';
import Variance from '../../popups/variance/Variance';
import { ActionType } from '../../redux/actions/AppActions';
import { VariancePopupData } from '../../redux/state/AppState';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, CreateChartSpy, getLastChart, mockChartJS } from '../test-utils';

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
  } as VariancePopupData,
};

describe('Variance tests', () => {
  let result: Element;
  let createChartSpy: CreateChartSpy;

  const updateProps = async (newProps: any): Promise<void> => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ dataId: newProps.dataId ?? props.dataId, settings: '' }, store);
    store.dispatch({ type: ActionType.OPEN_CHART, chartData: newProps.chartData ?? props.chartData });
    result = await act(
      () =>
        render(
          <Provider store={store}>
            <Variance {...newProps} />
          </Provider>,
          {
            container: document.getElementById('content') ?? undefined,
          },
        ).container,
    );
  };

  beforeAll(() => mockChartJS());

  beforeEach(async () => {
    createChartSpy = jest.spyOn(chartUtils, 'createChart');
    (axios.get as any).mockImplementation((url: string) => {
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
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
  });

  afterEach(jest.restoreAllMocks);

  const input = (): HTMLInputElement => result.getElementsByTagName('input')[0];

  it('Variance rendering variance report', async () => {
    await updateProps(props);
    expect(result.getElementsByTagName('h1')[0].textContent).toBe(
      `Based on checks 1 & 2 "bar" does not have Low Variance`,
    );
  });

  it('Variance rendering low variance report', async () => {
    await updateProps({
      chartData: { visible: true, selectedCol: 'lowVariance' },
    });
    expect(result.getElementsByTagName('h1')[0].textContent).toBe(
      `Based on checks 1 & 2 "lowVariance" has Low Variance`,
    );
  });

  it('Variance rendering histogram', async () => {
    await updateProps(props);
    expect(input().value).toBe('20');
    expect(getLastChart(createChartSpy).type).toBe('bar');
    expect(getLastChart(createChartSpy).options?.scales?.x).toEqual({ title: { display: true, text: 'Bin' } });
    await act(async () => {
      await fireEvent.change(input(), { target: { value: '' } });
    });
    await act(async () => {
      await fireEvent.keyDown(input(), { key: 'Shift' });
    });
    await act(async () => {
      await fireEvent.keyDown(input(), { key: 'Enter' });
    });
    await act(async () => {
      await fireEvent.change(input(), { target: { value: 'a' } });
    });
    await act(async () => {
      await fireEvent.keyDown(input(), { key: 'Enter' });
    });
    await act(async () => {
      await fireEvent.change(input(), { target: { value: '50' } });
    });
    await act(async () => {
      await fireEvent.keyDown(input(), { key: 'Enter' });
    });
    expect(screen.getByTestId('bins-input').getAttribute('value')).toBe('50');
  });

  it('Variance error', async () => {
    await updateProps({
      ...props,
      chartData: { ...props.chartData, selectedCol: 'error' },
    });
    expect(screen.getByRole('alert').textContent).toBe('variance error');
  });
});
