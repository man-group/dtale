import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';

import { OutputType } from '../../../popups/create/CreateColumnState';
import Reshape from '../../../popups/reshape/Reshape';
import { ReshapeSaveParams, ReshapeType } from '../../../popups/reshape/ReshapeState';
import { RemovableError } from '../../../RemovableError';
import * as ReshapeRepository from '../../../repository/ReshapeRepository';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, tickUpdate } from '../../test-utils';

/** Bundles alot of jest setup for Reshape component tests */
export class Spies {
  public saveSpy: jest.SpyInstance<
    Promise<ReshapeRepository.SaveResponse | undefined>,
    [dataId: string, params: ReshapeSaveParams]
  >;
  public axiosGetSpy: jest.SpyInstance;
  public useSelectorSpy: jest.SpyInstance;
  public onCloseSpy = jest.fn();
  public useDispatchSpy: jest.SpyInstance;

  /** Initializes all spy instances */
  constructor() {
    this.saveSpy = jest.spyOn(ReshapeRepository, 'save');
    this.axiosGetSpy = jest.spyOn(axios, 'get');
    this.useSelectorSpy = jest.spyOn(redux, 'useSelector');
    this.useDispatchSpy = jest.spyOn(redux, 'useDispatch');
  }

  /** Sets the mockImplementation/mockReturnValue for spy instances */
  public setupMockImplementations(): void {
    this.axiosGetSpy.mockImplementation(async (url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
    this.saveSpy.mockResolvedValue({ success: true, data_id: '2' });
    this.useSelectorSpy.mockReturnValue({
      dataId: '1',
      chartData: { visible: true },
    });
    this.useDispatchSpy.mockReturnValue(this.onCloseSpy);
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
    const result = mount(<Reshape />, { attachTo: document.getElementById('content') ?? undefined });
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
   * Find button with specific text within Reshape and simulate a click.
   *
   * @param result the current enzyme wrapper
   * @param name the name of the button to click
   * @return the updated enzyme wrapper
   */
  public async clickBuilder(result: ReactWrapper, name: string): Promise<ReactWrapper> {
    const buttonRow = result
      .find(Reshape)
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
   * Execute a save on the current reshape configuration and validate the configuration used.
   *
   * @param result current enzyme wrapper
   * @param overrides reshape parameter overrides
   * @param dataId the identifier of the data instance we want to reshape
   * @return the updated enzyme wrapper
   */
  public async validateCfg(
    result: ReactWrapper,
    overrides: Partial<ReshapeSaveParams>,
    dataId = '1',
  ): Promise<ReactWrapper> {
    result = await this.executeSave(result);
    expect(this.saveSpy).toHaveBeenLastCalledWith(dataId, {
      cfg: {},
      type: ReshapeType.PIVOT,
      output: OutputType.NEW,
      ...overrides,
    });
    return result;
  }

  /**
   * Validate and error exists and it's message.
   *
   * @param result current enzyme wrapper
   * @param error error message
   * @return the updated enzyme wrapper
   */
  public async validateError(result: ReactWrapper, error: string): Promise<ReactWrapper> {
    await act(async () => {
      result.find('div.modal-footer').first().find('button').first().simulate('click');
    });
    result = result.update();
    expect(result.find(RemovableError).text()).toBe(error);
    return result;
  }
}
