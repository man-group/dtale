import { act, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { DataViewer } from '../../../dtale/DataViewer';
import { ColumnFormat } from '../../../dtale/DataViewerState';
import * as serverState from '../../../dtale/serverStateManagement';
import DimensionsHelper from '../../DimensionsHelper';
import { clickColMenuButton } from '../../iframe/iframe-utils';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML } from '../../test-utils';

/** Bundles alot of jest setup for CreateColumn component tests */
export class Spies {
  public updateFormatsSpy: jest.SpyInstance<
    serverState.BaseReturn,
    [dataId: string, col: string, format: ColumnFormat, all: boolean, nanDisplay: string]
  >;
  public store?: Store;
  private dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  /** Initializes all spy instances */
  constructor() {
    this.updateFormatsSpy = jest.spyOn(serverState, 'updateFormats');
  }

  /** Sets the mockImplementation/mockReturnValue for spy instances */
  public setupMockImplementations(): void {
    (axios.get as any).mockImplementation(async (url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
    this.updateFormatsSpy.mockResolvedValue({ success: true });
  }

  /** Setup before all jest tests */
  public beforeAll(): void {
    this.dimensions.beforeAll();
  }

  /** Cleanup after all jest tests */
  public afterAll(): void {
    this.dimensions.afterAll();
    jest.restoreAllMocks();
  }

  /**
   * Build the initial wrapper.
   *
   * @param colIdx the index of the column to open the menu of.
   */
  public async setupWrapper(colIdx: number): Promise<Element> {
    const store = reduxUtils.createDtaleStore();
    this.store = store;
    buildInnerHTML({ settings: '' }, this.store);
    const result = await act(
      async () =>
        await render(
          <Provider store={store}>
            <DataViewer />
          </Provider>,
          {
            container: document.getElementById('content') ?? undefined,
          },
        ).container,
    );
    await act(async () => {
      await fireEvent.click(screen.queryAllByTestId('header-cell')[colIdx].getElementsByClassName('text-nowrap')[0]);
    });
    await clickColMenuButton('Formats');
    return result;
  }

  /**
   * Execute the "Apply" button on Formatting.
   */
  public async executeApply(): Promise<void> {
    await act(async () => {
      fireEvent.click(document.getElementsByClassName('modal-footer')[0].getElementsByTagName('button')[0]);
    });
  }

  /**
   * Execute apply on the current formatting popup and validate the values saved.
   *
   * @param dataId the identifier of the data instance we want to create a column for
   * @param col the col whoe format to update
   * @param fmt the formatting updates
   * @param applyToAll apply formatting updates to all
   * @param nanDisplay the string to display for nan values
   */
  public async validateCfg(
    dataId: string,
    col: string,
    fmt: ColumnFormat,
    applyToAll: boolean,
    nanDisplay: string,
  ): Promise<void> {
    await this.executeApply();
    expect(this.updateFormatsSpy).toHaveBeenLastCalledWith(dataId, col, fmt, applyToAll, nanDisplay);
  }

  /**
   * Get Formatting modal body
   *
   * @return Formatting body
   */
  public body(): Element {
    return document.getElementsByClassName('modal-body')[0];
  }

  /**
   * Get grid by its cell index
   *
   * @param cellIdx cell index
   * @return grid cell
   */
  public cell(cellIdx: string): Element {
    const grid = document.getElementsByClassName('main-grid')[0];
    return [...grid.getElementsByClassName('cell')].find((c) => c.getAttribute('cell_idx') === cellIdx)!;
  }
}
