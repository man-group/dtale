import { act, render, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';

import * as chartUtils from '../../../chartUtils';
import * as menuUtils from '../../../menuUtils';
import Charts from '../../../popups/charts/Charts';
import { ActionType } from '../../../redux/actions/AppActions';
import * as ChartsRepository from '../../../repository/ChartsRepository';
import DimensionsHelper from '../../DimensionsHelper';
import { mockColumnDef } from '../../mocks/MockColumnDef';
import reduxUtils from '../../redux-test-utils';
import {
  buildInnerHTML,
  CreateChartSpy,
  mockChartJS,
  mockD3Cloud,
  parseUrlParams,
  selectOption,
} from '../../test-utils';

/** Bundles alot of jest setup for Charts component tests */
export class Spies {
  public createChartSpy: CreateChartSpy;
  public openMenuSpy: jest.SpyInstance<
    (e: React.MouseEvent) => void,
    [
      open: (e: React.MouseEvent) => void,
      close: () => void,
      toggleRef?: React.RefObject<HTMLElement>,
      clickFilters?: (e: MouseEvent) => boolean,
    ]
  >;
  public chartsRepositorySpy: jest.SpyInstance;
  private result?: Element;

  private dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  /** Initializes all spy instances */
  constructor() {
    this.createChartSpy = jest.spyOn(chartUtils, 'createChart');
    this.openMenuSpy = jest.spyOn(menuUtils, 'openMenu');
    this.chartsRepositorySpy = jest.spyOn(ChartsRepository, 'load');
  }

  /** Sets the mockImplementation/mockReturnValue for spy instances */
  public setupMockImplementations(): void {
    (axios.get as any).mockImplementation((url: string) => {
      if (url.startsWith('/dtale/dtypes')) {
        return Promise.resolve({
          data: {
            dtypes: [
              ...reduxUtils.DTYPES.dtypes,
              mockColumnDef({
                name: 'error',
                index: 4,
                dtype: 'mixed-integer',
              }),
              mockColumnDef({
                name: 'error2',
                index: 5,
                dtype: 'mixed-integer',
              }),
              mockColumnDef({
                name: 'error test',
                index: 6,
                dtype: 'mixed-integer',
              }),
            ],
            success: true,
          },
        });
      } else if (url.startsWith('/dtale/chart-data/')) {
        const params = parseUrlParams(url);
        if (params.x === 'error' && JSON.parse(decodeURIComponent(params.y)).includes('error2')) {
          return Promise.resolve({ data: { data: {} } });
        }
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
  }

  /** Setup before all jest tests  */
  public beforeAll(): void {
    this.dimensions.beforeAll();
    mockChartJS();
    mockD3Cloud();
  }

  /** Cleanup after all jest tests */
  public afterAll(): void {
    this.dimensions.afterAll();
    jest.restoreAllMocks();
  }

  /**
   * Setup Charts React
   *
   * @return Charts component element.
   */
  public async setupCharts(): Promise<Element> {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    store.dispatch({ type: ActionType.OPEN_CHART, chartData: { visible: true, x: 'col4', y: ['col1'] } });
    this.result = await act(
      () =>
        render(
          <Provider store={store}>
            <Charts />
          </Provider>,
          {
            container: document.getElementById('content') ?? undefined,
          },
        ).container,
    );
    return this.result;
  }

  /**
   * Update selected chart type on Charts element
   *
   * @param chartType the chart type to update to.
   */
  public async updateChartType(chartType: string): Promise<void> {
    await selectOption(
      screen.getByText('Chart').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      chartType,
    );
  }

  /** Call the most recent closeMenu function passed to menuUtils.openMenu */
  public async callLastCloseMenu(): Promise<void> {
    await act(async () => {
      await this.openMenuSpy.mock.calls[this.openMenuSpy.mock.calls.length - 1][1]();
    });
  }

  /**
   * Get the last URL passed to ChartsRepository.load
   *
   * @return last chart url
   */
  public geLastChartUrl(): string {
    return this.chartsRepositorySpy.mock.calls[this.chartsRepositorySpy.mock.calls.length - 1][0];
  }
}
