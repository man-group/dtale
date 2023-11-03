import { act, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import { Chart, ChartEvent, Scale } from 'chart.js';
import * as React from 'react';
import { Provider } from 'react-redux';
import { default as configureStore } from 'redux-mock-store';

jest.mock('../../dtale/side/SidePanelButtons', () => {
  const { createMockComponent } = require('../mocks/createMockComponent');
  return {
    __esModule: true,
    default: createMockComponent(),
  };
});

import * as chartUtils from '../../chartUtils';
import { SORT_CHARS } from '../../dtale/Header';
import { Correlations } from '../../popups/correlations/Correlations';
import { AppState } from '../../redux/state/AppState';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import {
  buildChartContext,
  buildInnerHTML,
  CreateChartSpy,
  getLastChart,
  MockChart,
  mockChartJS,
  SCALE,
} from '../test-utils';

describe('DataViewer tests', () => {
  let container: Element;
  let createChartSpy: CreateChartSpy;
  const mockStore = configureStore();

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
    (axios.get as any).mockImplementation((url: string) => {
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

  const corrGrid = (): Element => container.getElementsByClassName('correlations-grid')[0];

  const buildResult = async (overrides?: Partial<AppState>): Promise<void> => {
    const store = mockStore({
      dataId: '0',
      sidePanel: { visible: false },
      chartData: { visible: true },
      ...overrides,
    });
    buildInnerHTML({ settings: '' });
    await act(() => {
      const result = render(
        <Provider store={store}>
          <Correlations />
        </Provider>,
        { container: document.getElementById('content') ?? undefined },
      );
      container = result.container;
    });
    await act(async () => {
      fireEvent.click(corrGrid().getElementsByClassName('cell')[1]);
    });
  };

  it('DataViewer: correlations scatter error', async () => {
    await buildResult();
    expect(screen.getByTestId('charts-body')).toBeDefined();
    expect(screen.getByRole('alert')).toBeDefined();
  });

  it('DataViewer: correlations', async () => {
    await buildResult({ dataId: '1' });
    Object.defineProperty(global.document, 'queryCommandSupported', {
      value: () => true,
    });
    Object.defineProperty(global.document, 'execCommand', { value: () => undefined });
    expect(screen.getByTestId('charts-body')).toBeDefined();

    const tsChart = getLastChart(createChartSpy, 'line');
    const layoutObj = {
      ...tsChart,
      scales: {
        'y-corr': { ...SCALE },
      },
      config: { _config: { data: tsChart.data } },
      ctx: buildChartContext(),
    };
    tsChart.plugins?.[0]?.afterLayout?.(layoutObj as any as Chart, {}, {});
    await act(async () => {
      tsChart.options?.onClick?.(
        {} as any as ChartEvent,
        [],
        new MockChart({} as HTMLCanvasElement, tsChart) as any as Chart,
      );
    });
    const ticks = { ticks: [0, 0] } as any as Scale;
    tsChart.options?.scales?.['y-corr']?.afterTickToLabelConversion?.(ticks);
    expect(ticks.ticks).toEqual([{ label: '' }, { label: '' }]);
    expect(getLastChart(createChartSpy).type).toBe('scatter');
    const scatterChart = getLastChart(createChartSpy);
    await act(async () => {
      scatterChart.options?.onClick?.(
        {} as any as ChartEvent,
        [],
        new MockChart({} as HTMLCanvasElement, scatterChart) as any as Chart,
      );
    });
    expect(window.location.reload).toHaveBeenCalled();
  });

  it('sorts correlations correctly', async () => {
    await buildResult({ dataId: '1' });
    await act(async () => {
      fireEvent.click(corrGrid().querySelector('div.headerCell.pointer')!);
    });
    const headers = (): HTMLCollectionOf<Element> =>
      corrGrid().getElementsByClassName('TopRightGrid_ScrollWrapper')[0].getElementsByClassName('headerCell');
    const header = (name: string): Element => [...headers()].find((h) => h.textContent!.endsWith(name))!;
    expect(header('col1').textContent).toContain(SORT_CHARS.ASC);
    await act(async () => {
      fireEvent.click(corrGrid().querySelector('div.headerCell.pointer')!);
    });
    expect(header('col1').textContent).toContain(SORT_CHARS.DESC);
    await act(async () => {
      fireEvent.click(corrGrid().querySelector('div.headerCell.pointer')!);
    });
    expect(header('col1').textContent).toBe('col1');
    await act(async () => {
      fireEvent.click(corrGrid().querySelector('div.headerCell.pointer')!);
    });
    await act(async () => {
      const headersList = [...headers()];
      fireEvent.click(headersList[headersList.length - 1]);
    });
    expect(header('col4').textContent).toContain(SORT_CHARS.ASC);
  });
});
