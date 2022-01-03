import axios from 'axios';
import { Chart, ChartEvent, Scale } from 'chart.js';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';

import * as chartUtils from '../../chartUtils';
import ChartsBody from '../../popups/charts/ChartsBody';
import Correlations from '../../popups/Correlations';
import CorrelationsGrid from '../../popups/correlations/CorrelationsGrid';
import { RemovableError } from '../../RemovableError';
import { CTX, SCALE } from '../chartUtils-test';
import DimensionsHelper from '../DimensionsHelper';
import { CorrelationsProps } from '../popups/Correlations-test';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, CreateChartSpy, getLastChart, MockChart, mockChartJS, tickUpdate } from '../test-utils';

describe('DataViewer tests', () => {
  let result: ReactWrapper;
  let props: CorrelationsProps;
  let createChartSpy: CreateChartSpy;

  const { location } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 1105,
    innerHeight: 1340,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    delete (window as any).location;
    (window as any).location = { reload: jest.fn() };
    mockChartJS();
  });

  beforeEach(async () => {
    createChartSpy = jest.spyOn(chartUtils, 'createChart');
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => {
      if (url.startsWith('/dtale/scatter/0')) {
        return Promise.resolve({
          data: {
            error: 'scatter error',
            traceback: 'scatter error traceback',
          },
        });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
    dimensions.afterAll();
    window.location = location;
  });

  const buildResult = async (overrides?: Partial<CorrelationsProps>): Promise<void> => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    props = { dataId: '0', chartData: { visible: true }, propagateState: jest.fn(), ...overrides };
    result = mount(
      <Provider store={store}>
        <Correlations {...props} />
      </Provider>,
      {
        attachTo: document.getElementById('content') ?? undefined,
      },
    );
    await act(async () => await tickUpdate(result));
    result = result.update();
    const corrGrid = result.find(Correlations).first().find('div.ReactVirtualized__Grid__innerScrollContainer');
    await act(async () => {
      corrGrid.find('div.cell').at(1).simulate('click');
    });
    result = result.update();
  };

  it('DataViewer: correlations scatter error', async () => {
    await buildResult();
    expect(result.find(ChartsBody).length).toBe(1);
    expect(result.find(RemovableError).length).toBe(1);
  });

  it('DataViewer: correlations', async () => {
    await buildResult({ dataId: '1' });
    Object.defineProperty(global.document, 'queryCommandSupported', {
      value: () => true,
    });
    Object.defineProperty(global.document, 'execCommand', { value: () => undefined });
    expect(result.find(ChartsBody).length).toBe(1);

    const tsChart = getLastChart(createChartSpy, 'line');
    const layoutObj = {
      ...tsChart,
      scales: {
        'y-corr': { ...SCALE },
      },
      config: { _config: { data: tsChart.data } },
      ctx: { ...CTX },
    };
    tsChart.plugins?.[0]?.afterLayout?.(layoutObj as any as Chart, {}, {});
    await act(async () => {
      tsChart.options?.onClick?.(
        {} as any as ChartEvent,
        [],
        new MockChart({} as HTMLElement, tsChart) as any as Chart,
      );
    });
    result = result.update();
    const ticks = { ticks: [0, 0] } as any as Scale;
    tsChart.options?.scales?.['y-corr']?.afterTickToLabelConversion?.(ticks);
    expect(ticks.ticks).toEqual([{ label: null }, { label: null }]);
    expect(result.find(Correlations).instance().state.chart).toBeDefined();
    const scatterChart = getLastChart(createChartSpy);
    await act(async () => {
      scatterChart.options?.onClick?.(
        {} as any as ChartEvent,
        [],
        new MockChart({} as HTMLElement, scatterChart) as any as Chart,
      );
    });
    result = result.update();
    expect(window.location.reload).toHaveBeenCalled();
  });

  it('sorts correlations correctly', async () => {
    await buildResult({ dataId: '1' });
    const grid = result.find(CorrelationsGrid);
    grid.find('div.headerCell.pointer').first().simulate('click');
    expect(grid.state().currSort).toEqual(['col1', 'ASC']);
    grid.find('div.headerCell.pointer').first().simulate('click');
    expect(grid.state().currSort).toEqual(['col1', 'DESC']);
    grid.find('div.headerCell.pointer').first().simulate('click');
    expect(grid.state().currSort).toBeNull();
    grid.find('div.headerCell.pointer').first().simulate('click');
    grid.find('div.headerCell.pointer').last().simulate('click');
    expect(grid.state().currSort).toEqual(['col4', 'ASC']);
  });
});
