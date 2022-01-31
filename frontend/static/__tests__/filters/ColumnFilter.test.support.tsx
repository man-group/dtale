import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';

import { ColumnFilter as ColumnFilterObj } from '../../dtale/DataViewerState';
import { default as ColumnFilter, ColumnFilterProps } from '../../filters/ColumnFilter';
import * as ColumnFilterRepository from '../../repository/ColumnFilterRepository';
import * as GenericRepository from '../../repository/GenericRepository';
import { mockColumnDef } from '../mocks/MockColumnDef';
import reduxUtils from '../redux-test-utils';
import { tickUpdate } from '../test-utils';

/** Bundles alot of jest setup for CreateColumn component tests */
export class Spies {
  public saveSpy: jest.SpyInstance<
    Promise<ColumnFilterRepository.SaveFilterResponse | undefined>,
    [string, string, ColumnFilterObj?]
  >;
  public axiosGetSpy: jest.SpyInstance;
  public useSelectorSpy: jest.SpyInstance;
  public useDispatchSpy: jest.SpyInstance;
  public fetchJsonSpy: jest.SpyInstance;

  /** Initializes all spy instances */
  constructor() {
    this.saveSpy = jest.spyOn(ColumnFilterRepository, 'save');
    this.axiosGetSpy = jest.spyOn(axios, 'get');
    this.useSelectorSpy = jest.spyOn(redux, 'useSelector');
    this.useDispatchSpy = jest.spyOn(redux, 'useDispatch');
    this.fetchJsonSpy = jest.spyOn(GenericRepository, 'getDataFromService');
  }

  /** Sets the mockImplementation/mockReturnValue for spy instances */
  public setupMockImplementations(): void {
    this.axiosGetSpy.mockImplementation(async (url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
    this.saveSpy.mockResolvedValue(Promise.resolve({ success: true, currFilters: {} }));
    this.useSelectorSpy.mockReturnValue('1');
    this.useDispatchSpy.mockReturnValue(jest.fn());
  }

  /** Cleanup after each jest tests */
  public afterEach(): void {
    jest.resetAllMocks();
  }

  /** Cleanup after all jest tests */
  public afterAll(): void {
    jest.restoreAllMocks();
  }

  /**
   * Build the initial enzyme wrapper.
   *
   * @param overrides component properties to pass to ColumnFilter
   * @return the enzyme wrapper for testing.
   */
  public async setupWrapper(overrides?: Partial<ColumnFilterProps>): Promise<ReactWrapper<ColumnFilterProps>> {
    const props: ColumnFilterProps = {
      selectedCol: 'col4',
      columns: [mockColumnDef({ name: 'col4', dtype: 'datetime64[ns]' })],
      ...overrides,
    };
    const result = mount(<ColumnFilter {...props} />);
    await act(async () => await tickUpdate(result));
    return result.update();
  }
}
