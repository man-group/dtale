import { act, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';
import selectEvent from 'react-select-event';

import * as chartUtils from '../../../chartUtils';
import * as BKFilterUtils from '../../../popups/timeseries/BKFilter';
import * as CFFilterUtils from '../../../popups/timeseries/CFFilter';
import * as HPFilterUtils from '../../../popups/timeseries/HPFilter';
import Reports from '../../../popups/timeseries/Reports';
import { TimeseriesAnalysisType } from '../../../popups/timeseries/TimeseriesAnalysisState';
import { ActionType } from '../../../redux/actions/AppActions';
import { mockColumnDef } from '../../mocks/MockColumnDef';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, CreateChartSpy, getLastChart, parseUrlParams, selectOption } from '../../test-utils';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

const useDispatchMock = useDispatch as jest.Mock;

describe('TimeseriesAnalysis', () => {
  let wrapper: Element;
  const mockDispatch = jest.fn();
  let createChartSpy: CreateChartSpy;

  beforeEach(async () => {
    useDispatchMock.mockImplementation(() => mockDispatch);
    createChartSpy = jest.spyOn(chartUtils, 'createChart');
    (axios.get as any).mockImplementation(async (url: string) => {
      if (url.startsWith('/dtale/dtypes')) {
        return Promise.resolve({
          data: {
            dtypes: [
              ...reduxUtils.DTYPES.dtypes,
              mockColumnDef({
                name: 'col5',
                index: 4,
                dtype: 'datetime64[ns]',
                visible: true,
                unique_ct: 1,
              }),
            ],
            success: true,
          },
        });
      }
      if (url.startsWith('/dtale/timeseries-analysis')) {
        return Promise.resolve({ data: { data: { datasets: [{}, {}, {}] } } });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
  });

  const buildMock = async (): Promise<void> => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    wrapper = await act(
      () =>
        render(
          <Provider store={store}>
            <Reports />
          </Provider>,
          {
            container: document.getElementById('content') ?? undefined,
          },
        ).container,
    );
  };

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  const updateType = async (type: TimeseriesAnalysisType): Promise<void> => {
    await act(async () => {
      await fireEvent.click(screen.getByText(type));
    });
  };

  it('renders successfully', async () => {
    await buildMock();
    expect(screen.getByText('Index')).toBeDefined();
    const indexSelect = screen.getByText('Index').parentElement!.getElementsByClassName('Select')[0] as HTMLElement;
    await act(async () => {
      await selectEvent.openMenu(indexSelect);
    });
    expect(Array.from(indexSelect.getElementsByClassName('Select__option')).map((o) => o.textContent)).toEqual([
      'col4',
      'col5',
    ]);
    expect(screen.getByText('Lambda')).toBeDefined();
  });

  it('builds chart configs successfully', async () => {
    await buildMock();
    await selectOption(
      screen.getByText('Index').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'col4',
    );
    await selectOption(
      screen.getByText('Column').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'col2',
    );
    let tsChart = getLastChart(createChartSpy, 'line');
    expect(tsChart).toBeDefined();
    await act(async () => {
      await fireEvent.click(wrapper.getElementsByTagName('i')[0]);
    });
    tsChart = getLastChart(createChartSpy, 'line');
    expect(Object.keys(tsChart?.options?.scales ?? {})).toEqual(['y-col2', 'y-cycle', 'y-trend', 'x']);
  });

  it('handles mount error', async () => {
    (axios.get as any).mockImplementation(async (url: string) => Promise.resolve({ data: { error: 'failure' } }));
    await buildMock();
    expect(screen.getByRole('alert').textContent).toBe('failure');
  });

  it('renders report inputs successfully', async () => {
    await buildMock();
    await updateType(TimeseriesAnalysisType.BKFILTER);
    expect(screen.getByText('K')).toBeDefined();
    await updateType(TimeseriesAnalysisType.CFFILTER);
    expect(screen.getByText('Drift')).toBeDefined();
    await updateType(TimeseriesAnalysisType.SEASONAL_DECOMPOSE);
    expect(screen.getByText('Model')).toBeDefined();
    await updateType(TimeseriesAnalysisType.STL);
    expect(screen.queryAllByText('Model')).toHaveLength(0);
  });

  it('closes successfully', async () => {
    await buildMock();
    await act(async () => {
      await fireEvent.click(wrapper.getElementsByTagName('button')[0]);
    });
    expect(mockDispatch).toHaveBeenLastCalledWith({ type: ActionType.HIDE_SIDE_PANEL });
  });

  describe('validate report builder', () => {
    beforeEach(async () => {
      await buildMock();
      await selectOption(
        screen.getByText('Index').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
        'col4',
      );
      await selectOption(
        screen.getByText('Column').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
        'col2',
      );
    });

    const getLastChartUrl = (): string => {
      const chartCalls = (axios.get as any as jest.SpyInstance).mock.calls.filter((call) =>
        call[0].startsWith('/dtale/timeseries-analysis'),
      );
      return chartCalls[chartCalls.length - 1][0];
    };

    it('bkfilter', async () => {
      await updateType(TimeseriesAnalysisType.BKFILTER);
      await act(async () => {
        await fireEvent.change(screen.getByText('Low').parentElement!.getElementsByTagName('input')[0], {
          target: { value: 6 },
        });
      });
      await act(async () => {
        await fireEvent.change(screen.getByText('High').parentElement!.getElementsByTagName('input')[0], {
          target: { value: 32 },
        });
      });
      await act(async () => {
        await fireEvent.change(screen.getByText('K').parentElement!.getElementsByTagName('input')[0], {
          target: { value: 12 },
        });
      });
      expect(wrapper.getElementsByTagName('pre')).not.toHaveLength(0);
      const url = getLastChartUrl();
      expect(url?.startsWith('/dtale/timeseries-analysis/1')).toBe(true);
      const urlParams = parseUrlParams(url);
      expect(urlParams.type).toBe('bkfilter');
    });

    it('hpfilter', async () => {
      await act(async () => {
        await fireEvent.change(screen.getByText('Lambda').parentElement!.getElementsByTagName('input')[0], {
          target: { value: 1600 },
        });
      });
      expect(wrapper.getElementsByTagName('pre')).not.toHaveLength(0);
      const url = getLastChartUrl();
      const urlParams = parseUrlParams(url);
      expect(urlParams.type).toBe('hpfilter');
    });

    it('cffilter', async () => {
      await updateType(TimeseriesAnalysisType.CFFILTER);
      await act(async () => {
        await fireEvent.change(screen.getByText('Low').parentElement!.getElementsByTagName('input')[0], {
          target: { value: 6 },
        });
      });
      await act(async () => {
        await fireEvent.change(screen.getByText('High').parentElement!.getElementsByTagName('input')[0], {
          target: { value: 32 },
        });
      });
      await act(async () => {
        await fireEvent.click(screen.getByText('Drift').parentElement!.getElementsByTagName('i')[0]);
      });
      expect(wrapper.getElementsByTagName('pre')).not.toHaveLength(0);
      const url = getLastChartUrl();
      const urlParams = parseUrlParams(url);
      expect(urlParams.type).toBe('cffilter');
    });

    it('seasonal_decompose', async () => {
      await updateType(TimeseriesAnalysisType.SEASONAL_DECOMPOSE);
      await act(async () => {
        await fireEvent.click(screen.getByText('additive'));
      });
      expect(wrapper.getElementsByTagName('pre')).not.toHaveLength(0);
      const url = getLastChartUrl();
      const urlParams = parseUrlParams(url);
      expect(urlParams.type).toBe('seasonal_decompose');
    });

    it('stl', async () => {
      await updateType(TimeseriesAnalysisType.STL);
      expect(wrapper.getElementsByTagName('pre')).not.toHaveLength(0);
      const url = getLastChartUrl();
      const urlParams = parseUrlParams(url);
      expect(urlParams.type).toBe('stl');
    });
  });

  describe('report errors', () => {
    it('BaseInputs', async () => {
      await buildMock();
      await act(async () => {
        await fireEvent.change(wrapper.getElementsByTagName('input')[0], { target: { value: '' } });
      });
      expect(screen.getByRole('alert').textContent).toBe('Missing an index selection!');
      await selectOption(
        screen.getByText('Index').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
        'col4',
      );
      expect(screen.getByRole('alert').textContent).toBe('Missing a column selection!');
    });

    it('bkfilter', async () => {
      expect(BKFilterUtils.validate({ index: 'col4', col: 'col1', low: 0, high: 0, K: 0 })).toBe('Please enter a low!');
      expect(BKFilterUtils.validate({ index: 'col4', col: 'col1', low: 6, high: 0, K: 0 })).toBe(
        'Please enter a high!',
      );
      expect(BKFilterUtils.validate({ index: 'col4', col: 'col1', low: 6, high: 32, K: 0 })).toBe('Please enter K!');
    });

    it('hpfilter', async () => {
      expect(HPFilterUtils.validate({ index: 'col4', col: 'col1', lamb: 0 })).toBe('Please enter a lambda!');
    });

    it('cffilter', async () => {
      expect(CFFilterUtils.validate({ index: 'col4', col: 'col1', low: 0, high: 0, drift: false })).toBe(
        'Please enter a low!',
      );
      expect(CFFilterUtils.validate({ index: 'col4', col: 'col1', low: 6, high: 0, drift: false })).toBe(
        'Please enter a high!',
      );
    });
  });
});
