import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';
import { ActionMeta, default as Select } from 'react-select';

import * as chartUtils from '../../../chartUtils';
import * as menuUtils from '../../../menuUtils';
import Charts from '../../../popups/charts/Charts';
import ChartsBody from '../../../popups/charts/ChartsBody';
import DimensionsHelper from '../../DimensionsHelper';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, CreateChartSpy, mockChartJS, mockD3Cloud, parseUrlParams, tickUpdate } from '../../test-utils';

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
  public axiosGetSpy: jest.SpyInstance;
  public useSelectorSpy: jest.SpyInstance;

  private dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  /** Initializes all spy instances */
  constructor() {
    this.createChartSpy = jest.spyOn(chartUtils, 'createChart');
    this.openMenuSpy = jest.spyOn(menuUtils, 'openMenu');
    this.axiosGetSpy = jest.spyOn(axios, 'get');
    this.useSelectorSpy = jest.spyOn(redux, 'useSelector');
  }

  /** Sets the mockImplementation/mockReturnValue for spy instances */
  public setupMockImplementations(): void {
    this.axiosGetSpy.mockImplementation((url: string) => {
      if (url.startsWith('/dtale/chart-data/')) {
        const params = parseUrlParams(url);
        if (params.x === 'error' && JSON.parse(decodeURIComponent(params.y)).includes('error2')) {
          return Promise.resolve({ data: { data: {} } });
        }
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    this.useSelectorSpy.mockReturnValue({ dataId: '1', chartData: { visible: true, x: 'x', y: ['y1', 'y2'] } });
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
   * @return Charts component ReactWrapper instance.
   */
  public async setupCharts(): Promise<ReactWrapper> {
    buildInnerHTML({ settings: '' });
    const result = mount(<Charts />, {
      attachTo: document.getElementById('content') ?? undefined,
    });
    await act(async () => await tickUpdate(result));
    return result.update();
  }

  /**
   * Update selected chart type on Charts ReactWraper
   *
   * @param result Charts component ReactWrapper
   * @param chartType the chart type to update to.
   * @return Charts component ReactWrapper instance with udpated chart type selection.
   */
  public async updateChartType(result: ReactWrapper, chartType: string): Promise<ReactWrapper> {
    await act(async () => {
      result
        .find(ChartsBody)
        .find(Select)
        .first()
        .props()
        .onChange?.({ value: chartType }, {} as ActionMeta<unknown>);
    });
    return result.update();
  }

  /** Call the most recent closeMenu function passed to menuUtils.openMenu */
  public async callLastCloseMenu(): Promise<void> {
    await act(async () => {
      this.openMenuSpy.mock.calls[this.openMenuSpy.mock.calls.length - 1][1]();
    });
  }
}
