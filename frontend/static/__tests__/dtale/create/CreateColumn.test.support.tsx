import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';

import CreateColumn from '../../../popups/create/CreateColumn';
import { CreateColumnSaveParams, CreateColumnType, SaveAs } from '../../../popups/create/CreateColumnState';
import * as CreateColumnRepository from '../../../repository/CreateColumnRepository';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, tickUpdate } from '../../test-utils';

/** Bundles alot of jest setup for CreateColumn component tests */
export class Spies {
  public saveSpy: jest.SpyInstance<
    Promise<CreateColumnRepository.SaveResponse | undefined>,
    [dataId: string, params: CreateColumnSaveParams, route?: string]
  >;
  public axiosGetSpy: jest.SpyInstance;
  public useSelectorSpy: jest.SpyInstance;
  public useDispatchSpy: jest.SpyInstance;
  public propagateStateSpy: jest.Mock;

  /** Initializes all spy instances */
  constructor() {
    this.saveSpy = jest.spyOn(CreateColumnRepository, 'save');
    this.axiosGetSpy = jest.spyOn(axios, 'get');
    this.useSelectorSpy = jest.spyOn(redux, 'useSelector');
    this.useDispatchSpy = jest.spyOn(redux, 'useDispatch');
    this.propagateStateSpy = jest.fn();
  }

  /** Sets the mockImplementation/mockReturnValue for spy instances */
  public setupMockImplementations(): void {
    this.axiosGetSpy.mockImplementation(async (url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
    this.saveSpy.mockResolvedValue({ success: true });
    this.useSelectorSpy.mockReturnValue({
      dataId: '1',
      chartData: { visible: true },
    });
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
   * @return the enzyme wrapper for testing.
   */
  public async setupWrapper(): Promise<ReactWrapper> {
    buildInnerHTML({ settings: '' });
    const result = mount(<CreateColumn propagateState={this.propagateStateSpy} />, {
      attachTo: document.getElementById('content') ?? undefined,
    });
    await act(async () => await tickUpdate(result));
    return result.update();
  }

  /**
   * Execute the "Save" button on CreateColumn.
   *
   * @param result the current enzyme wrapper.
   * @return the udpated enzyme wrapper.
   */
  public async executeSave(result: ReactWrapper): Promise<ReactWrapper> {
    await act(async () => {
      result.find('div.modal-footer').first().find('button').first().simulate('click');
    });
    return result.update();
  }

  /**
   * Find button with specific text within CreateColumn and simulate a click.
   *
   * @param result the current enzyme wrapper
   * @param name the name of the button to click
   * @return the updated enzyme wrapper
   */
  public async clickBuilder(result: ReactWrapper, name: string): Promise<ReactWrapper> {
    const buttonRow = result
      .find(CreateColumn)
      .find('div.form-group')
      .findWhere((row: ReactWrapper) => row.find('button').findWhere((b) => b.text() === name) !== undefined);
    await act(async () => {
      buttonRow
        .find('button')
        .findWhere((b) => b.text() === name)
        .first()
        .simulate('click');
    });
    return result.update();
  }

  /**
   * Execute a save on the current column creation configuration and validate the configuration used.
   *
   * @param result current enzyme wrapper
   * @param overrides column creation parameter overrides
   * @param dataId the identifier of the data instance we want to create a column for
   * @param route the API route to use for saving
   * @return the updated enzyme wrapper
   */
  public async validateCfg(
    result: ReactWrapper,
    overrides: Partial<CreateColumnSaveParams>,
    dataId = '1',
    route = 'build-column',
  ): Promise<ReactWrapper> {
    result = await this.executeSave(result);
    expect(this.saveSpy).toHaveBeenLastCalledWith(
      dataId,
      {
        cfg: {},
        name: 'col',
        saveAs: SaveAs.NEW,
        type: CreateColumnType.NUMERIC,
        ...overrides,
      },
      route,
    );
    return result;
  }
}
