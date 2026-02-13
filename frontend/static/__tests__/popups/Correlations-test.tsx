import { act, fireEvent, getByText, screen } from '@testing-library/react';
import axios from 'axios';
import { Chart, ChartEvent } from 'chart.js';
import * as React from 'react';

jest.mock('../../dtale/side/SidePanelButtons', () => {
  const { createMockComponent } = require('../mocks/createMockComponent');
  return {
    __esModule: true,
    default: createMockComponent(),
  };
});

import * as chartUtils from '../../chartUtils';
import * as windowUtils from '../../location';
import { Correlations } from '../../popups/correlations/Correlations';
import { percent } from '../../popups/correlations/correlationsUtils';
import { AppActions } from '../../redux/actions/AppActions';
import { CorrelationsPopupData, PopupType } from '../../redux/state/AppState';
import correlationsData from '../data/correlations.json';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import {
  CreateChartSpy,
  getLastChart,
  MockChart,
  mockChartJS,
  renderWithStore,
  WindowMock,
} from '../test-utils';

const chartData: CorrelationsPopupData = {
  visible: true,
  type: PopupType.CORRELATIONS,
  title: 'Correlations Test',
  query: 'col == 3',
};

describe('Correlations tests', () => {
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });
  let windowMock: WindowMock;

  let result: Element;
  let createChartSpy: CreateChartSpy;

  beforeAll(() => {
    dimensions.beforeAll();
    windowMock = new WindowMock();
    mockChartJS();
  });

  beforeEach(async () => {
    jest.spyOn(windowUtils, 'getLocation').mockReturnValue({
      pathname: '/dtale/popup',
    } as any);
    createChartSpy = jest.spyOn(chartUtils, 'createChart');
    (axios.get as any).mockImplementation((url: string) => {
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
  });

  afterEach(() => {
    (axios.get as any).mockRestore();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
    dimensions.afterAll();
    windowMock.restore();
  });

  const buildResult = async (overrides?: Partial<CorrelationsPopupData>): Promise<void> => {
    const store = reduxUtils.createDtaleStore();
    store.dispatch(AppActions.OpenChartAction({ ...chartData, ...overrides }));
    result = await act(
      () =>
        renderWithStore(<Correlations />, {
          store,
          innerHTMLProps: { settings: '' },
        }).container,
    );
  };

  it('Correlations rendering data and export', async () => {
    await buildResult();
    await act(async () => {
      await fireEvent.click(result.querySelectorAll('div.cell')[1]);
    });
    expect(screen.getByTestId('charts-body')).toBeDefined();
    expect(
      Array.from(result.querySelector('select.custom-select')!.getElementsByTagName('option')).map(
        (o) => o.textContent,
      ),
    ).toEqual(['col4', 'col5']);
    await act(async () => {
      await fireEvent.change(result.querySelector('select.custom-select')!, { target: { value: 'col5' } });
    });
    expect(getByText(screen.getByTestId('corr-selected-date'), 'col4')).toHaveAttribute('selected');

    // Export image
    await act(async () => {
      await fireEvent.click(screen.getByText('Export Image'));
    });
    expect(windowMock.openSpy).toHaveBeenLastCalledWith(
      '/dtale/correlations/1?encodeStrings=false&pps=false&image=true',
      '_blank',
    );
  });

  it('Correlations rendering data and filtering it', async () => {
    await buildResult({ col1: 'col1', col2: 'col3' });
    expect(screen.queryAllByRole('grid')[3].textContent).toBe('-0.10');
    expect(screen.queryAllByRole('grid')[1].getElementsByClassName('headerCell')).toHaveLength(1);
  });

  it('Correlations rendering data w/ one date column', async () => {
    (axios.get as any).mockImplementation((url: string) => {
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
    await act(async () => {
      await fireEvent.click(result.querySelectorAll('div.cell')[1]);
    });
    expect(screen.getByTestId('charts-body')).toBeDefined();
    expect(result.querySelector('select.custom-select')).toBeNull();
    expect(axios.get).toHaveBeenLastCalledWith(expect.stringContaining('dateCol=col4'));
  });

  it('Correlations rendering data w/ no date columns', async () => {
    (axios.get as any).mockImplementation((url: string) => {
      if (url.startsWith('/dtale/correlations/')) {
        return Promise.resolve({ data: { data: correlationsData.data, dates: [] } });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    await buildResult();
    await act(async () => {
      await fireEvent.click(result.querySelectorAll('div.cell')[1]);
    });
    expect(document.getElementById('rawScatterChart')).toBeDefined();
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
        new MockChart({} as HTMLCanvasElement, scatterChart) as any as Chart,
      );
    });
  });

  const minPeriods = (): Element => screen.getByTestId('min-periods');

  it('Correlations rendering rolling data', async () => {
    (axios.get as any).mockImplementation((url: string) => {
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
    await act(async () => {
      await fireEvent.click(result.querySelectorAll('div.cell')[1]);
    });
    expect(screen.getByTestId('charts-body')).toBeDefined();
    const currChart = getLastChart(createChartSpy);
    await act(async () => {
      currChart.options?.onClick?.(
        { foo: 1 } as any as ChartEvent,
        [],
        new MockChart({} as HTMLCanvasElement, currChart) as any as Chart,
      );
    });
    expect(getLastChart(createChartSpy).type).toBe('scatter');
    expect(result.querySelector('dl.property-pair.inline')!.textContent).toMatch(
      /col1 vs. col2 for 2018-12-16 thru 2018-12-19/,
    );
    expect(
      (getLastChart(createChartSpy).options?.plugins?.tooltip?.callbacks as any)?.title?.([
        { raw: { index: 0, date: '2018-04-30' }, datasetIndex: 0, index: 0 },
      ]),
    ).toEqual(['index: 0', 'date: 2018-04-30']);
    expect(
      Array.from(result.querySelector('select.custom-select')!.getElementsByTagName('option')).map(
        (o) => o.textContent,
      ),
    ).toEqual(['col4', 'col5']);
    expect(getByText(screen.getByTestId('corr-selected-date'), 'col4')).toHaveAttribute('selected');
    await act(async () => {
      await fireEvent.change(screen.getByTestId('window'), { target: { value: '5' } });
    });
    await act(async () => {
      await fireEvent.change(minPeriods(), { target: { value: '5' } });
    });
    await act(async () => {
      await fireEvent.keyDown(minPeriods(), { key: 'Enter' });
    });
    expect(axios.get).toHaveBeenLastCalledWith(expect.stringContaining('minPeriods=5'));
  });

  it('Correlations missing data', async () => {
    (axios.get as any).mockImplementation((url: string) => {
      if (url.startsWith('/dtale/correlations/')) {
        return Promise.resolve({ data: { error: 'No data found.' } });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    await buildResult();
    expect(result.querySelector('div.ReactVirtualized__Grid__innerScrollContainer')).toBeNull();
  });

  it('Correlations - percent formatting', () => {
    expect(percent('N/A')).toBe('N/A');
  });
});
