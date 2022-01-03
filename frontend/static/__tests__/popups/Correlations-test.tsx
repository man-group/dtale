import axios from 'axios';
import { Chart, ChartEvent } from 'chart.js';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { default as Select } from 'react-select';

import * as chartUtils from '../../chartUtils';
import { DataViewerPropagateState } from '../../dtale/DataViewerState';
import ChartsBody from '../../popups/charts/ChartsBody';
import Correlations from '../../popups/Correlations';
import CorrelationScatterStats from '../../popups/correlations/CorrelationScatterStats';
import CorrelationsGrid from '../../popups/correlations/CorrelationsGrid';
import CorrelationsTsOptions from '../../popups/correlations/CorrelationsTsOptions';
import correlationsData from '../data/correlations.json';
import DimensionsHelper from '../DimensionsHelper';
import { createMockComponent } from '../mocks/createMockComponent';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, CreateChartSpy, getLastChart, MockChart, mockChartJS, tickUpdate } from '../test-utils';

const chartData = {
  visible: true,
  type: 'correlations',
  title: 'Correlations Test',
  query: 'col == 3',
};

/** Component properties for Correlations */
export interface CorrelationsProps {
  dataId: string;
  chartData: Record<string, any>;
  propagateState: DataViewerPropagateState;
}

/** State properties for Correlations */
export interface CorrelationsState {
  chart?: chartUtils.ChartObj;
  error?: JSX.Element;
  scatterError?: JSX.Element;
  correlations?: Record<string, any>;
  selectedCols: string[];
  tsUrl?: string;
  selectedDate?: string;
  tsType: string;
  scatterUrl?: string;
  rolling: boolean;
  useRolling: boolean;
  window: number;
  minPeriods: number;
  loadingCorrelations: boolean;
  encodeStrings: boolean;
  strings: string[];
  dummyColMappings: Record<string, any>;
}

describe('Correlations tests', () => {
  const { location, opener } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  let createChartSpy: CreateChartSpy;

  beforeAll(() => {
    jest.mock('../../dtale/side/SidePanelButtons', () => ({
      SidePanelButtons: createMockComponent(),
    }));
    dimensions.beforeAll();

    delete window.opener;
    window.opener = { location: { reload: jest.fn() } };
    delete (window as any).location;
    (window as any).location = { pathname: '/dtale/popup' };

    mockChartJS();
  });

  beforeEach(async () => {
    createChartSpy = jest.spyOn(chartUtils, 'createChart');
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => {
      if (url.startsWith('/dtale/correlations/')) {
        const query = new URLSearchParams(url.split('?')[1]).get('query');
        if (query === 'null') {
          return Promise.resolve({ data: { error: 'No data found.' } });
        }
        if (query === 'one-date') {
          return Promise.resolve({
            data: {
              data: correlationsData.data,
              dates: [{ name: 'col4', rolling: false }],
            },
          });
        }
        if (query === 'no-date') {
          return Promise.resolve({ data: { data: correlationsData.data, dates: [] } });
        }
        if (query === 'rolling') {
          const dates = [
            { name: 'col4', rolling: true },
            { name: 'col5', rolling: false },
          ];
          return Promise.resolve({ data: { data: correlationsData.data, dates } });
        }
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });

    buildInnerHTML({ settings: '' });
  });

  afterAll(() => {
    jest.restoreAllMocks();
    dimensions.afterAll();
    window.opener = opener;
    window.location = location;
  });

  const buildResult = async (props = { chartData }): Promise<ReactWrapper<CorrelationsProps, CorrelationsState>> => {
    const store = reduxUtils.createDtaleStore();
    let result = mount(
      <Provider store={store}>
        <Correlations {...props} dataId="1" />
      </Provider>,
      {
        attachTo: document.getElementById('content') ?? undefined,
      },
    );
    await act(async () => await tickUpdate(result));
    result = result.update();
    return result.find(Correlations);
  };

  it('Correlations rendering data', async () => {
    let result = await buildResult();
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
    expect(result.find(Correlations).state().selectedDate).toBe('col5');
  });

  it('Correlations rendering data and filtering it', async () => {
    const result = await buildResult();
    let corrGrid = result.find(CorrelationsGrid).first();
    const filters = corrGrid.find(Select);
    filters.first().props().onChange({ value: 'col1' });
    result.update();
    corrGrid = result.find(CorrelationsGrid).first();
    expect([correlationsData.data[0]]).toEqual(corrGrid.instance().state.correlations);
    filters.last().props().onChange({ value: 'col3' });
    result.update();
    expect([{ column: 'col1', col3: -0.098802 }]).toEqual(corrGrid.instance().state.correlations);
  });

  it('Correlations rendering data w/ one date column', async () => {
    const result = await buildResult({
      chartData: { ...chartData, query: 'one-date' },
    });
    const corrGrid = result.first().find('div.ReactVirtualized__Grid__innerScrollContainer');
    corrGrid.find('div.cell').at(1).simulate('click');
    await tickUpdate(result);
    expect(result.find(ChartsBody).length).toBe(1);
    expect(result.find('select.custom-select').length).toBe(0);
    expect(result.state().selectedDate).toBe('col4');
  });

  it('Correlations rendering data w/ no date columns', async () => {
    const props = {
      chartData: { ...chartData, query: 'no-date' },
      onClose: () => undefined,
      propagateState: () => undefined,
    };
    let result = await buildResult(props);
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
    const corr = result.find(Correlations).instance();
    expect(corr?.shouldComponentUpdate?.({ ...corr.props, dataId: '2' }, {} as CorrelationsState, {})).toBe(true);
    expect(corr?.shouldComponentUpdate?.(corr.props, { ...corr.state, chart: undefined }, {})).toBe(false);
    expect(corr?.shouldComponentUpdate?.(corr.props, corr.state, {})).toBe(false);
  });

  it('Correlations rendering rolling data', async () => {
    let result = await buildResult({
      chartData: { ...chartData, query: 'rolling' },
    });
    await act(async () => await tickUpdate(result));
    result = result.update();
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
    await act(async () => await tickUpdate(result));
    result = result.update();
    expect(result.find(Correlations).instance().state.chart).toBeDefined();
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
    expect(result.find(Correlations).state().selectedDate).toBe('col4');
    await act(async () => {
      result
        .find(CorrelationsTsOptions)
        .find('input')
        .findWhere((i) => i.prop('type') === 'text')
        .first()
        .simulate('change', { target: { value: '5' } });
    });
    result = result.update();
    const minPeriods = result
      .find(CorrelationsTsOptions)
      .find('input')
      .findWhere((i) => i.prop('type') === 'text')
      .first();
    await act(async () => {
      minPeriods.simulate('change', { target: { value: '5' } });
      minPeriods.simulate('keyPress', { key: 'Enter' });
    });
    result = result.update();
  });

  it('Correlations missing data', async () => {
    const result = await buildResult({
      chartData: { ...chartData, query: 'null' },
    });
    expect(result.find('div.ReactVirtualized__Grid__innerScrollContainer').length).toBe(0);
  });

  it('Correlations - percent formatting', () => {
    const { percent } = require('../../popups/correlations/correlationsUtils').default;
    expect(percent('N/A')).toBe('N/A');
  });
});
