import axios from 'axios';
import { Chart, ChartEvent, Scale } from 'chart.js';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';

import { createMockComponent } from '../mocks/createMockComponent'; // eslint-disable-line import/order
jest.mock('../../dtale/side/SidePanelButtons', () => ({
  __esModule: true,
  default: createMockComponent(),
}));

import * as chartUtils from '../../chartUtils';
import ChartsBody from '../../popups/charts/ChartsBody';
import { Correlations } from '../../popups/correlations/Correlations';
import { CorrelationsCell } from '../../popups/correlations/CorrelationsCell';
import CorrelationsGrid from '../../popups/correlations/CorrelationsGrid';
import { AppState, SortDir } from '../../redux/state/AppState';
import { RemovableError } from '../../RemovableError';
import { CTX, SCALE } from '../chartUtils-test';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, CreateChartSpy, getLastChart, MockChart, mockChartJS, tickUpdate } from '../test-utils';

describe('DataViewer tests', () => {
  let result: ReactWrapper;
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

  const buildResult = async (overrides?: Partial<AppState>): Promise<void> => {
    const useSelectorSpy = jest.spyOn(redux, 'useSelector');
    useSelectorSpy.mockReturnValue({ dataId: '0', chartData: { visible: true }, ...overrides });
    buildInnerHTML({ settings: '' });
    result = mount(<Correlations />, { attachTo: document.getElementById('content') ?? undefined });
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
    expect(ticks.ticks).toEqual([{ label: '' }, { label: '' }]);
    expect(getLastChart(createChartSpy).type).toBe('scatter');
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
    await act(async () => {
      result.find(CorrelationsGrid).find('div.headerCell.pointer').first().simulate('click');
    });
    result = result.update();
    expect(result.find(CorrelationsCell).first().props().currSort).toEqual(['col1', 'ASC']);
    await act(async () => {
      result.find(CorrelationsGrid).find('div.headerCell.pointer').first().simulate('click');
    });
    result = result.update();
    expect(result.find(CorrelationsCell).first().props().currSort).toEqual(['col1', SortDir.DESC]);
    await act(async () => {
      result.find(CorrelationsGrid).find('div.headerCell.pointer').first().simulate('click');
    });
    result = result.update();
    expect(result.find(CorrelationsCell).first().props().currSort).toBeUndefined();
    await act(async () => {
      result.find(CorrelationsGrid).find('div.headerCell.pointer').first().simulate('click');
    });
    result = result.update();
    await act(async () => {
      result.find(CorrelationsGrid).find('div.headerCell.pointer').last().simulate('click');
    });
    result = result.update();
    expect(result.find(CorrelationsCell).first().props().currSort).toEqual(['col4', SortDir.ASC]);
  });
});
