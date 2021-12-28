import { ChartConfiguration, ChartType, DefaultDataPoint } from 'chart.js';
import * as React from 'react';

import * as chartUtils from '../../../chartUtils';
import {
  AnalysisProps,
  AnalysisState,
  AnalysisType,
  HistogramChartData,
} from '../../../popups/analysis/ColumnAnalysisState';
import * as columnAnalysisUtils from '../../../popups/analysis/columnAnalysisUtils';
import { PopupType } from '../../../redux/state/AppState';
import * as GenericRepository from '../../../repository/GenericRepository';

describe('columnAnalysisUtils', () => {
  let createChartSpy: jest.SpyInstance<
    chartUtils.ChartObj,
    [ctx: HTMLElement | null, cfg: ChartConfiguration<ChartType, DefaultDataPoint<ChartType>, unknown>]
  >;
  let fetchJsonSpy: jest.SpyInstance<Promise<unknown>, [string]>;
  let getElementByIdSpy: jest.SpyInstance<HTMLElement | null, [elementId: string]>;

  beforeEach(() => {
    getElementByIdSpy = jest.spyOn(document, 'getElementById');
    getElementByIdSpy.mockImplementation((selector: string): HTMLElement | null => {
      if (selector === 'describe') {
        return { innerHtml: '' } as any as HTMLElement;
      }
      return document.querySelector(`#${selector}`);
    });
    createChartSpy = jest.spyOn(chartUtils, 'createChart');
    createChartSpy.mockReturnValue({} as chartUtils.ChartObj);
    fetchJsonSpy = jest.spyOn(GenericRepository, 'getDataFromService');
    fetchJsonSpy.mockResolvedValue(Promise.resolve({ data: {} }));
  });

  afterEach(jest.restoreAllMocks);

  it('correctly handles targeted histogram data', () => {
    const fetchedData: HistogramChartData = {
      targets: [
        { target: 'foo', data: [3, 4] },
        { target: 'bar', data: [5, 6] },
      ],
      desc: {},
      labels: ['1', '2'],
      code: '',
      query: '',
      cols: [],
      dtype: 'int64',
      chart_type: AnalysisType.HISTOGRAM,
      data: [],
    };
    columnAnalysisUtils.createChart({} as HTMLElement, fetchedData, { type: AnalysisType.HISTOGRAM });
    expect(createChartSpy).toHaveBeenCalled();
    const finalChart = createChartSpy.mock.calls[0][1];
    expect(finalChart.data.datasets.map((d) => d.label)).toEqual(['foo', 'bar']);
  });

  it('correctly handles probability histogram load', () => {
    const propagateState = jest.fn();
    const props: AnalysisProps = {
      chartData: { type: PopupType.COLUMN_ANALYSIS, visible: true, selectedCol: 'foo' },
      height: 400,
      dataId: '1',
    };
    columnAnalysisUtils.dataLoader(props, {} as AnalysisState, propagateState, React.createRef(), () => undefined, {
      type: AnalysisType.HISTOGRAM,
      density: true,
    });
    expect(fetchJsonSpy).toHaveBeenCalled();
    const search = fetchJsonSpy.mock.calls[0][0].split('?')[1];
    const params = JSON.parse(
      '{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}',
    );
    expect(params).toMatchObject({ density: 'true' });
  });
});
