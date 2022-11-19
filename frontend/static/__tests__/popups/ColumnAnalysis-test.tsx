import { act, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';

import * as chartUtils from '../../chartUtils';
import ColumnAnalysis from '../../popups/analysis/ColumnAnalysis';
import { ActionType } from '../../redux/actions/AppActions';
import { ColumnAnalysisPopupData, PopupType } from '../../redux/state/AppState';
import * as ColumnAnalysisRepository from '../../repository/ColumnAnalysisRepository';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, CreateChartSpy, getLastChart, mockChartJS, parseUrlParams, selectOption } from '../test-utils';

import { ANALYSIS_DATA } from './ColumnAnalysis.test.support';

const props: ColumnAnalysisPopupData = {
  visible: true,
  type: PopupType.COLUMN_ANALYSIS,
  title: 'ColumnAnalysis Test',
  selectedCol: 'bar',
  query: 'col == 3',
};

describe('ColumnAnalysis tests', () => {
  let result: Element;
  let createChartSpy: CreateChartSpy;
  let loadAnalysisSpy: jest.SpyInstance<
    Promise<ColumnAnalysisRepository.ColumnAnalysisResponse | undefined>,
    [dataId: string, params: Record<string, any>]
  >;

  const updateProps = async (chartData?: Partial<ColumnAnalysisPopupData>): Promise<void> => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    store.dispatch({ type: ActionType.OPEN_CHART, chartData: { ...props, ...chartData } });
    if (chartData?.visible === false) {
      store.dispatch({ type: ActionType.CLOSE_CHART });
    }
    result = await act(
      () =>
        render(
          <Provider store={store}>
            <ColumnAnalysis />
          </Provider>,
          {
            container: document.getElementById('content') ?? undefined,
          },
        ).container,
    );
  };

  beforeAll(mockChartJS);

  beforeEach(async () => {
    createChartSpy = jest.spyOn(chartUtils, 'createChart');
    loadAnalysisSpy = jest.spyOn(ColumnAnalysisRepository, 'loadAnalysis');
    (axios.get as any).mockImplementation((url: string) => {
      if (url.startsWith('/dtale/column-analysis')) {
        const params = parseUrlParams(url);
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
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
  });

  afterEach(jest.restoreAllMocks);

  const input = (): HTMLInputElement => result.getElementsByTagName('input')[0];

  it('ColumnAnalysis rendering float data', async () => {
    await updateProps();
    expect(screen.getByText('Geolocation')).toBeDefined();
    expect(input().value).toBe('20');
    expect(getLastChart(createChartSpy).type).toBe('bar');
    expect(getLastChart(createChartSpy).data.datasets[0].data).toEqual(ANALYSIS_DATA.data);
    expect(getLastChart(createChartSpy).data.labels).toEqual(ANALYSIS_DATA.labels);
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
    expect(loadAnalysisSpy).toHaveBeenLastCalledWith(
      '1',
      expect.objectContaining({
        bins: 50,
      }),
    );
  });

  it('ColumnAnalysis chart functionality', async () => {
    createChartSpy.mockReset();
    await updateProps({ visible: false });
    expect(createChartSpy).not.toHaveBeenCalled();
  });

  it('ColumnAnalysis additional functions', async () => {
    await updateProps();
    await act(async () => {
      await fireEvent.click(screen.getByText('Categories'));
    });
    await selectOption(screen.getByTestId('category-col').getElementsByClassName('Select')[0] as HTMLElement, 'strCol');
    await act(async () => {
      await fireEvent.change(input(), { target: { value: '50' } });
    });
    await act(async () => {
      fireEvent.keyDown(input(), { key: 'Enter' });
    });
    expect(loadAnalysisSpy).toHaveBeenLastCalledWith(
      '1',
      expect.objectContaining({
        categoryAgg: 'mean',
        categoryCol: 'strCol',
        type: 'categories',
      }),
    );
  });

  it('geolocation chart functionality', async () => {
    await updateProps();
    await act(async () => {
      await fireEvent.click(screen.getByText('Geolocation'));
    });
    const latitudeFilter = screen.getByText('Latitude:');
    expect(latitudeFilter).toBeDefined();
    expect(latitudeFilter.parentElement!.textContent).toBe('Latitude:barLongitude:lon');
  });

  it('qq plot chart functionality', async () => {
    await updateProps();
    const qqSpy = jest.spyOn(chartUtils, 'createQQ');
    await act(async () => {
      await fireEvent.click(screen.getByText('Q-Q Plot'));
    });
    expect(qqSpy).toHaveBeenCalled();
  });

  it('ColumnAnalysis rendering int data', async () => {
    await updateProps({ ...props, selectedCol: 'intCol' });
    await act(async () => {
      await fireEvent.click(screen.getByText('Value Counts'));
    });
    expect(loadAnalysisSpy).toHaveBeenLastCalledWith('1', expect.objectContaining({ type: 'value_counts' }));
  });

  it('ColumnAnalysis rendering string data', async () => {
    await updateProps({ ...props, selectedCol: 'strCol' });
    expect(loadAnalysisSpy).toHaveBeenLastCalledWith('1', expect.objectContaining({ type: 'histogram' }));
  });

  it('ColumnAnalysis rendering date data', async () => {
    await updateProps({ ...props, selectedCol: 'dateCol' });
    await act(async () => {
      await fireEvent.click(screen.getByText('Value Counts'));
    });
    await selectOption(
      result.getElementsByClassName('ordinal-dd')[0].getElementsByClassName('Select')[0] as HTMLElement,
      'intCol',
    );
    expect(loadAnalysisSpy).toHaveBeenLastCalledWith(
      '1',
      expect.objectContaining({
        ordinalAgg: 'sum',
        ordinalCol: 'intCol',
      }),
    );
  });

  it('ColumnAnalysis missing data', async () => {
    await updateProps({ ...props, selectedCol: 'null' });
    expect(createChartSpy).not.toHaveBeenCalled();
  });

  it('ColumnAnalysis error', async () => {
    await updateProps({ ...props, selectedCol: 'error' });
    expect(screen.getByRole('alert').textContent).toBe('column analysis error');
  });
});
