import axios from 'axios';
import { Chart, ChartEvent } from 'chart.js';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';
import { default as Select } from 'react-select';
import { MultiGrid } from 'react-virtualized';

import { createMockComponent } from '../mocks/createMockComponent'; // eslint-disable-line import/order
jest.mock('../../dtale/side/SidePanelButtons', () => ({
  SidePanelButtons: createMockComponent(),
}));

import * as chartUtils from '../../chartUtils';
import ChartsBody from '../../popups/charts/ChartsBody';
import { Correlations } from '../../popups/correlations/Correlations';
import CorrelationScatterStats from '../../popups/correlations/CorrelationScatterStats';
import CorrelationsGrid from '../../popups/correlations/CorrelationsGrid';
import CorrelationsTsOptions from '../../popups/correlations/CorrelationsTsOptions';
import { percent } from '../../popups/correlations/correlationsUtils';
import correlationsData from '../data/correlations.json';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, CreateChartSpy, getLastChart, MockChart, mockChartJS, tickUpdate } from '../test-utils';

const chartData = {
  visible: true,
  type: 'correlations',
  title: 'Correlations Test',
  query: 'col == 3',
};

describe('Correlations tests', () => {
  const { location, opener } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  let result: ReactWrapper;
  let createChartSpy: CreateChartSpy;
  let axiosGetSpy: jest.SpyInstance;

  beforeAll(() => {
    dimensions.beforeAll();
    delete window.opener;
    window.opener = { location: { reload: jest.fn() } };
    delete (window as any).location;
    (window as any).location = { pathname: '/dtale/popup' };
    mockChartJS();
  });

  beforeEach(async () => {
    const useSelectorSpy = jest.spyOn(redux, 'useSelector');
    useSelectorSpy.mockReturnValue({ dataId: '1', chartData });
    createChartSpy = jest.spyOn(chartUtils, 'createChart');
    axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => {
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });

    buildInnerHTML({ settings: '' });
  });

  afterEach(() => axiosGetSpy.mockRestore());

  afterAll(() => {
    jest.restoreAllMocks();
    dimensions.afterAll();
    window.opener = opener;
    window.location = location;
  });

  const buildResult = async (props = { chartData }): Promise<void> => {
    result = mount(<Correlations />, { attachTo: document.getElementById('content') ?? undefined });
    await act(async () => await tickUpdate(result));
    result = result.update();
  };

  it('Correlations rendering data', async () => {
    await buildResult();
    const corrGrid = result.first().find('div.ReactVirtualized__Grid__innerScrollContainer');
    await act(async () => {
      corrGrid.find('div.cell').at(1).simulate('click');
    });
    result = result.update();
    expect(result.find(ChartsBody)).toHaveLength(1);
    expect(
      result
        .find('select.custom-select')
        .first()
        .find('option')
        .map((o) => o.text()),
    ).toEqual(['col4', 'col5']);
    await act(async () => {
      result
        .find('select.custom-select')
        .first()
        .simulate('change', { target: { value: 'col5' } });
    });
    result = result.update();
    expect(result.find(CorrelationsTsOptions).props().selectedDate).toBe('col5');
  });

  it('Correlations rendering data and filtering it', async () => {
    await buildResult();
    await act(async () => {
      result.find(CorrelationsGrid).find(Select).first().props().onChange({ value: 'col1' });
    });
    result = result.update();
    expect(result.find(MultiGrid).props().rowCount).toBe(2);
    await act(async () => {
      result.find(CorrelationsGrid).find(Select).last().props().onChange({ value: 'col3' });
    });
    result = result.update();
    expect(result.find(MultiGrid).props().columnCount).toBe(2);
  });

  it('Correlations rendering data w/ one date column', async () => {
    axiosGetSpy.mockImplementation((url: string) => {
      if (url.startsWith('/dtale/correlations/')) {
        return Promise.resolve({
          data: {
            data: correlationsData.data,
            dates: [{ name: 'col4', rolling: false }],
          },
        });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    await buildResult();
    const corrGrid = result.first().find('div.ReactVirtualized__Grid__innerScrollContainer');
    await act(async () => {
      corrGrid.find('div.cell').at(1).simulate('click');
    });
    result = result.update();
    expect(result.find(ChartsBody).length).toBe(1);
    expect(result.find('select.custom-select').length).toBe(0);
    expect(result.find(CorrelationsTsOptions).props().selectedDate).toBe('col4');
  });

  it('Correlations rendering data w/ no date columns', async () => {
    axiosGetSpy.mockImplementation((url: string) => {
      if (url.startsWith('/dtale/correlations/')) {
        return Promise.resolve({ data: { data: correlationsData.data, dates: [] } });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    await buildResult();
    const corrGrid = result.first().find('div.ReactVirtualized__Grid__innerScrollContainer');
    await act(async () => {
      corrGrid.find('div.cell').at(1).simulate('click');
    });
    result = result.update();
    expect(result.find('#rawScatterChart').length).toBe(1);
    const scatterChart = getLastChart(createChartSpy);
    const title = (scatterChart.options?.plugins?.tooltip?.callbacks as any)?.title?.([{ raw: { index: 0 } }]);
    expect(title).toEqual(['index: 0']);
    const label = (scatterChart.options?.plugins?.tooltip?.callbacks as any)?.label?.({
      raw: { x: 1.4, y: 1.5 },
      dataset: { xLabels: ['col1'], yLabels: ['col2'] },
    });
    expect(label).toEqual(['col1: 1.4', 'col2: 1.5']);
    await act(async () => {
      scatterChart.options?.onClick?.(
        {} as ChartEvent,
        [],
        new MockChart({} as HTMLElement, scatterChart) as any as Chart,
      );
    });
    result = result.update();
  });

  const minPeriods = (): ReactWrapper =>
    result
      .find(CorrelationsTsOptions)
      .find('input')
      .findWhere((i) => i.prop('type') === 'text')
      .last();

  it('Correlations rendering rolling data', async () => {
    axiosGetSpy.mockImplementation((url: string) => {
      if (url.startsWith('/dtale/correlations/')) {
        const dates = [
          { name: 'col4', rolling: true },
          { name: 'col5', rolling: false },
        ];
        return Promise.resolve({ data: { data: correlationsData.data, dates } });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    await buildResult();
    const corrGrid = result.first().find('div.ReactVirtualized__Grid__innerScrollContainer');
    corrGrid.find('div.cell').at(1).simulate('click');
    await act(async () => await tickUpdate(result));
    result = result.update();
    expect(result.find(ChartsBody).length).toBe(1);
    const currChart = getLastChart(createChartSpy);
    await act(async () => {
      currChart.options?.onClick?.(
        { foo: 1 } as any as ChartEvent,
        [],
        new MockChart({} as HTMLElement, currChart) as any as Chart,
      );
    });
    result = result.update();
    expect(getLastChart(createChartSpy).type).toBe('scatter');
    expect(result.find(CorrelationScatterStats).text()).toMatch(/col1 vs. col2 for 2018-12-16 thru 2018-12-19/);
    expect(
      (getLastChart(createChartSpy).options?.plugins?.tooltip?.callbacks as any)?.title?.([
        { raw: { index: 0, date: '2018-04-30' }, datasetIndex: 0, index: 0 },
      ]),
    ).toEqual(['index: 0', 'date: 2018-04-30']);
    expect(
      result
        .find('select.custom-select')
        .first()
        .find('option')
        .map((o) => o.text()),
    ).toEqual(['col4', 'col5']);
    expect(result.find(CorrelationsTsOptions).props().selectedDate).toBe('col4');
    await act(async () => {
      result
        .find(CorrelationsTsOptions)
        .find('input')
        .findWhere((i) => i.prop('type') === 'text')
        .first()
        .simulate('change', { target: { value: '5' } });
    });
    result = result.update();
    await act(async () => {
      minPeriods().simulate('change', { target: { value: '5' } });
    });
    result = result.update();
    await act(async () => {
      minPeriods().simulate('keydown', { key: 'Enter' });
    });
    result = result.update();
    expect(result.find(CorrelationsTsOptions).props().minPeriods).toBe(5);
  });

  it('Correlations missing data', async () => {
    axiosGetSpy.mockImplementation((url: string) => {
      if (url.startsWith('/dtale/correlations/')) {
        return Promise.resolve({ data: { error: 'No data found.' } });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    await buildResult();
    expect(result.find('div.ReactVirtualized__Grid__innerScrollContainer').length).toBe(0);
  });

  it('Correlations - percent formatting', () => {
    expect(percent('N/A')).toBe('N/A');
  });
});
