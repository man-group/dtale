import { act, render } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';

import { ColumnFilter as ColumnFilterObj } from '../../dtale/DataViewerState';
import { default as ColumnFilter, ColumnFilterProps } from '../../filters/ColumnFilter';
import * as ColumnFilterRepository from '../../repository/ColumnFilterRepository';
import * as GenericRepository from '../../repository/GenericRepository';
import { mockColumnDef } from '../mocks/MockColumnDef';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML } from '../test-utils';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

/** Bundles alot of jest setup for CreateColumn component tests */
export class Spies {
  public saveSpy: jest.SpyInstance<
    Promise<ColumnFilterRepository.SaveFilterResponse | undefined>,
    [string, string, ColumnFilterObj?]
  >;
  public fetchJsonSpy: jest.SpyInstance;
  public mockDispatch = jest.fn();
  private useDispatchMock = useDispatch as jest.Mock;
  private result?: Element;

  /** Initializes all spy instances */
  constructor() {
    this.saveSpy = jest.spyOn(ColumnFilterRepository, 'save');
    this.fetchJsonSpy = jest.spyOn(GenericRepository, 'getDataFromService');
  }

  /** Sets the mockImplementation/mockReturnValue for spy instances */
  public setupMockImplementations(): void {
    this.useDispatchMock.mockImplementation(() => this.mockDispatch);
    (axios.get as any).mockImplementation(async (url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
    this.saveSpy.mockResolvedValue(Promise.resolve({ success: true, currFilters: {} }));
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
   * Build the initial wrapper.
   *
   * @param overrides component properties to pass to ColumnFilter
   * @return the wrapper for testing.
   */
  public async setupWrapper(overrides?: Partial<ColumnFilterProps>): Promise<Element> {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    const props: ColumnFilterProps = {
      selectedCol: 'col4',
      columns: [mockColumnDef({ name: 'col4', dtype: 'datetime64[ns]' })],
      ...overrides,
    };
    return await act(async () => {
      this.result = render(
        <Provider store={store}>
          <ColumnFilter {...props} />
        </Provider>,
        { container: document.getElementById('content') ?? undefined },
      ).container;
      return this.result;
    });
  }
}
