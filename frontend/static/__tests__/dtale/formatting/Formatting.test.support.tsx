import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';

import { DataViewer } from '../../../dtale/DataViewer';
import { ColumnFormat } from '../../../dtale/DataViewerState';
import * as serverState from '../../../dtale/serverStateManagement';
import Formatting from '../../../popups/formats/Formatting';
import DimensionsHelper from '../../DimensionsHelper';
import { clickColMenuButton } from '../../iframe/iframe-utils';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, tickUpdate } from '../../test-utils';

/** Bundles alot of jest setup for CreateColumn component tests */
export class Spies {
  public updateFormatsSpy: jest.SpyInstance<
    serverState.BaseReturn,
    [dataId: string, col: string, format: ColumnFormat, all: boolean, nanDisplay: string]
  >;
  public axiosGetSpy: jest.SpyInstance;
  public propagateStateSpy: jest.Mock;
  private dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  /** Initializes all spy instances */
  constructor() {
    this.updateFormatsSpy = jest.spyOn(serverState, 'updateFormats');
    this.axiosGetSpy = jest.spyOn(axios, 'get');
    this.propagateStateSpy = jest.fn();
  }

  /** Sets the mockImplementation/mockReturnValue for spy instances */
  public setupMockImplementations(): void {
    this.axiosGetSpy.mockImplementation(async (url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
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
   * Build the initial enzyme wrapper.
   *
   * @param colIdx the index of the column to open the menu of.
   * @return the enzyme wrapper for testing.
   */
  public async setupWrapper(colIdx: number): Promise<ReactWrapper> {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    let result = mount(
      <redux.Provider store={store}>
        <DataViewer />
      </redux.Provider>,
      {
        attachTo: document.getElementById('content') ?? undefined,
      },
    );
    await act(async () => await tickUpdate(result));
    result = result.update();
    await act(async () => {
      result.find('.main-grid div.headerCell').at(colIdx).find('.text-nowrap').simulate('click');
    });
    result.update();
    return await clickColMenuButton(result, 'Formats');
  }

  /**
   * Execute the "Apply" button on Formatting.
   *
   * @param result the current enzyme wrapper.
   * @return the udpated enzyme wrapper.
   */
  public async executeApply(result: ReactWrapper): Promise<ReactWrapper> {
    await act(async () => {
      result.find(Formatting).find('div.modal-footer').first().find('button').first().simulate('click');
    });
    return result.update();
  }

  /**
   * Execute apply on the current formatting popup and validate the values saved.
   *
   * @param result current enzyme wrapper
   * @param dataId the identifier of the data instance we want to create a column for
   * @param col the col whoe format to update
   * @param fmt the formatting updates
   * @param applyToAll apply formatting updates to all
   * @param nanDisplay the string to display for nan values
   * @return the updated enzyme wrapper
   */
  public async validateCfg(
    result: ReactWrapper,
    dataId: string,
    col: string,
    fmt: ColumnFormat,
    applyToAll: boolean,
    nanDisplay: string,
  ): Promise<ReactWrapper> {
    result = await this.executeApply(result);
    expect(this.updateFormatsSpy).toHaveBeenLastCalledWith(dataId, col, fmt, applyToAll, nanDisplay);
    return result;
  }
}
