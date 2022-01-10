import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';
import { default as Select } from 'react-select';

import ButtonToggle from '../../ButtonToggle';
import * as chartUtils from '../../chartUtils';
import ColumnAnalysis from '../../popups/analysis/ColumnAnalysis';
import ColumnAnalysisFilters from '../../popups/analysis/filters/ColumnAnalysisFilters';
import { RemovableError } from '../../RemovableError';
import * as ColumnAnalysisRepository from '../../repository/ColumnAnalysisRepository';
import { buildInnerHTML, CreateChartSpy, getLastChart, mockChartJS, tickUpdate } from '../test-utils';

import { ANALYSIS_DATA } from './ColumnAnalysis.test.support';

const props = {
  dataId: '1',
  chartData: {
    visible: true,
    type: 'column-analysis',
    title: 'ColumnAnalysis Test',
    selectedCol: 'bar',
    query: 'col == 3',
  },
};

describe('ColumnAnalysis tests', () => {
  let result: ReactWrapper;
  let useSelectorSpy: jest.SpyInstance<
    unknown,
    [selector: (state: unknown) => unknown, equalityFn?: ((left: unknown, right: unknown) => boolean) | undefined]
  >;
  let createChartSpy: CreateChartSpy;
  let loadAnalysisSpy: jest.SpyInstance<
    Promise<ColumnAnalysisRepository.ColumnAnalysisResponse | undefined>,
    [dataId: string, params: Record<string, any>]
  >;

  const updateProps = async (newProps = props): Promise<void> => {
    useSelectorSpy.mockReset();
    useSelectorSpy.mockReturnValue(newProps);
    buildInnerHTML();
    result = mount(<ColumnAnalysis />, {
      attachTo: document.getElementById('content') ?? undefined,
    });
    await act(async () => await tickUpdate(result));
    result = result.update();
  };

  beforeAll(mockChartJS);

  beforeEach(async () => {
    createChartSpy = jest.spyOn(chartUtils, 'createChart');
    loadAnalysisSpy = jest.spyOn(ColumnAnalysisRepository, 'loadAnalysis');
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => {
      if (url.startsWith('/dtale/column-analysis')) {
        const params = JSON.parse(
          '{"' + decodeURI(url.split('?')[1]).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}',
        );
        const ordinal = ANALYSIS_DATA.data;
        const count = ANALYSIS_DATA.data;
        if (params.col === 'null') {
          return Promise.resolve({ data: undefined });
        }
        if (params.col === 'error') {
          return Promise.resolve({ data: { error: 'column analysis error' } });
        }
        if (params.col === 'intCol') {
          if (params.type === 'value_counts') {
            return Promise.resolve({
              data: {
                ...ANALYSIS_DATA,
                chart_type: 'value_counts',
                ordinal,
                timestamp: new Date().getTime(),
              },
            });
          }
          return Promise.resolve({
            data: {
              ...ANALYSIS_DATA,
              dtype: 'int64',
              chart_type: 'histogram',
              timestamp: new Date().getTime(),
            },
          });
        }
        if (params.col === 'dateCol') {
          return Promise.resolve({
            data: {
              ...ANALYSIS_DATA,
              dtype: 'datetime',
              chart_type: 'value_counts',
              ordinal,
              timestamp: new Date().getTime(),
            },
          });
        }
        if (params.col === 'strCol') {
          return Promise.resolve({
            data: {
              ...ANALYSIS_DATA,
              dtype: 'string',
              chart_type: 'value_counts',
              ordinal,
              timestamp: new Date().getTime(),
            },
          });
        }
        if (['bar', 'baz'].includes(params.col)) {
          if (params.type === 'categories') {
            return Promise.resolve({
              data: {
                ...ANALYSIS_DATA,
                chart_type: 'categories',
                count,
                timestamp: new Date().getTime(),
              },
            });
          }
          if (params.type === 'geolocation') {
            return Promise.resolve({
              data: {
                ...ANALYSIS_DATA,
                chart_type: 'geolocation',
                lat: [1, 2, 3],
                lon: [4, 5, 6],
                timestamp: new Date().getTime(),
              },
            });
          }
          if (params.type === 'qq') {
            return Promise.resolve({
              data: {
                ...ANALYSIS_DATA,
                chart_type: 'qq',
                x: [1],
                y: [1],
                x2: [1],
                y2: [1],
                timestamp: new Date().getTime(),
              },
            });
          }
          return Promise.resolve({ data: { ...ANALYSIS_DATA, timestamp: new Date().getTime() } });
        }
      }
      return Promise.resolve({ data: {} });
    });

    useSelectorSpy = jest.spyOn(redux, 'useSelector');
  });

  afterEach(jest.restoreAllMocks);

  const input = (): ReactWrapper => result.find('input');
  const filters = (): ReactWrapper => result.find(ColumnAnalysisFilters);

  it('ColumnAnalysis rendering float data', async () => {
    await updateProps();
    expect(result.find(ButtonToggle).props().options[2].label).toBe('Geolocation');
    expect(input().prop('value')).toBe('20');
    expect(getLastChart(createChartSpy).type).toBe('bar');
    expect(getLastChart(createChartSpy).data.datasets[0].data).toEqual(ANALYSIS_DATA.data);
    expect(getLastChart(createChartSpy).data.labels).toEqual(ANALYSIS_DATA.labels);
    expect(getLastChart(createChartSpy).options?.scales?.x).toEqual({ title: { display: true, text: 'Bin' } });
    await act(async () => {
      input().simulate('change', { target: { value: '' } });
      input().simulate('keyDown', { key: 'Shift' });
      input().simulate('keyDown', { key: 'Enter' });
      input().simulate('change', { target: { value: 'a' } });
      input().simulate('keyDown', { key: 'Enter' });
      input().simulate('change', { target: { value: '50' } });
      input().simulate('keyDown', { key: 'Enter' });
    });
    result = result.update();
    expect(loadAnalysisSpy).toHaveBeenLastCalledWith(
      '1',
      expect.objectContaining({
        bins: 50,
      }),
    );
  });

  it('ColumnAnalysis chart functionality', async () => {
    createChartSpy.mockReset();
    await updateProps({
      ...props,
      chartData: { ...props.chartData, visible: false },
    });
    expect(createChartSpy).not.toHaveBeenCalled();
  });

  it('ColumnAnalysis additional functions', async () => {
    await updateProps();
    await act(async () => {
      result.find(ColumnAnalysisFilters).find('button').at(1).simulate('click');
    });
    result = result.update();
    await act(async () => {
      filters().find(Select).first().props().onChange({ value: 'col1' });
    });
    result = result.update();
    await act(async () => {
      filters()
        .find('input')
        .first()
        .simulate('change', { target: { value: '50' } });
      filters().find('input').first().simulate('keyDown', { key: 'Enter' });
    });
    result = result.update();
    expect(loadAnalysisSpy).toHaveBeenLastCalledWith(
      '1',
      expect.objectContaining({
        categoryAgg: 'mean',
        categoryCol: 'col1',
        type: 'categories',
      }),
    );
  });

  it('geolocation chart functionality', async () => {
    await updateProps();
    await act(async () => {
      result.find('ButtonToggle').find('button').at(2).simulate('click');
    });
    result = result.update();
    expect(result.find('GeoFilters')).toHaveLength(1);
    expect(result.find('GeoFilters').text()).toBe('Latitude:barLongitude:lon');
  });

  it('qq plot chart functionality', async () => {
    await updateProps();
    const qqSpy = jest.spyOn(chartUtils, 'createQQ');
    await act(async () => {
      result.find('ButtonToggle').find('button').last().simulate('click');
    });
    result = result.update();
    expect(qqSpy).toHaveBeenCalled();
  });

  it('ColumnAnalysis rendering int data', async () => {
    await updateProps({
      ...props,
      chartData: { ...props.chartData, selectedCol: 'intCol' },
    });
    await act(async () => {
      filters().find('button').at(1).simulate('click');
    });
    result = result.update();
    expect(loadAnalysisSpy).toHaveBeenLastCalledWith('1', expect.objectContaining({ type: 'value_counts' }));
  });

  it('ColumnAnalysis rendering string data', async () => {
    await updateProps({
      ...props,
      chartData: { ...props.chartData, selectedCol: 'strCol' },
    });
    expect(loadAnalysisSpy).toHaveBeenLastCalledWith('1', expect.objectContaining({ type: 'histogram' }));
  });

  it('ColumnAnalysis rendering date data', async () => {
    await updateProps({
      ...props,
      chartData: { ...props.chartData, selectedCol: 'dateCol' },
    });
    await act(async () => {
      filters().find('button').at(1).simulate('click');
    });
    result = result.update();
    const ordinalInputs = result.find(Select);
    await act(async () => {
      ordinalInputs.first().props().onChange({ value: 'col1' });
    });
    expect(loadAnalysisSpy).toHaveBeenLastCalledWith(
      '1',
      expect.objectContaining({
        ordinalAgg: 'sum',
        ordinalCol: 'col1',
      }),
    );
  });

  it('ColumnAnalysis missing data', async () => {
    await updateProps({
      ...props,
      chartData: { ...props.chartData, selectedCol: 'null' },
    });
    expect(createChartSpy).not.toHaveBeenCalled();
  });

  it('ColumnAnalysis error', async () => {
    await updateProps({
      ...props,
      chartData: { ...props.chartData, selectedCol: 'error' },
    });
    expect(result.find(RemovableError).text()).toBe('column analysis error');
  });
});
