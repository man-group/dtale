import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';

import ButtonToggle from '../../../ButtonToggle';
import { SaveAs } from '../../../popups/create/CreateColumnState';
import CreateReplacement from '../../../popups/replacement/CreateReplacement';
import { CreateReplacementSaveParams, ReplacementType } from '../../../popups/replacement/CreateReplacementState';
import * as CreateReplacementRepository from '../../../repository/CreateReplacementRepository';
import reduxUtils from '../../redux-test-utils';
import { tickUpdate } from '../../test-utils';

/** Bundles alot of jest setup for CreateColumn component tests */
export class Spies {
  public saveSpy: jest.SpyInstance<
    Promise<CreateReplacementRepository.SaveResponse | undefined>,
    [dataId: string, params: CreateReplacementSaveParams]
  >;
  public axiosGetSpy: jest.SpyInstance;
  public useSelectorSpy: jest.SpyInstance;
  public useDispatchSpy: jest.SpyInstance;
  public propagateStateSpy: jest.Mock;

  /** Initializes all spy instances */
  constructor() {
    this.saveSpy = jest.spyOn(CreateReplacementRepository, 'save');
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
      chartData: { visible: true, propagateState: this.propagateStateSpy, selectedCol: 'col1' },
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
    // buildInnerHTML({ settings: '' });
    const result = mount(<CreateReplacement />);
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
    await act(async () => {
      result
        .find(CreateReplacement)
        .find(ButtonToggle)
        .at(1)
        .find('button')
        .filterWhere((btn: ReactWrapper) => btn.text() === name)
        .first()
        .simulate('click');
    });
    return result.update();
  }

  /**
   * Execute a save on the current column replacement configuration and validate the configuration used.
   *
   * @param result current enzyme wrapper
   * @param overrides column replacement parameter overrides
   * @param dataId the identifier of the data instance we want to create a column for
   * @return the updated enzyme wrapper
   */
  public async validateCfg(
    result: ReactWrapper,
    overrides: Partial<CreateReplacementSaveParams>,
    dataId = '1',
  ): Promise<ReactWrapper> {
    result = await this.executeSave(result);
    expect(this.saveSpy).toHaveBeenLastCalledWith(dataId, {
      cfg: {},
      saveAs: SaveAs.NEW,
      type: ReplacementType.IMPUTER,
      ...overrides,
    });
    return result;
  }

  /**
   * Update the name of the replacement being created
   * @param result current enzyme wrapper
   * @param name the name to apply
   * @return the updated enzyme wrapper
   */
  public async setName(result: ReactWrapper, name: string): Promise<ReactWrapper> {
    await act(async () => {
      result.find(CreateReplacement).find(ButtonToggle).first().find('button').last().simulate('click');
    });
    const updatedResult = result.update();
    await act(async () => {
      updatedResult
        .find(CreateReplacement)
        .find('div.form-group')
        .first()
        .find('input')
        .first()
        .simulate('change', { target: { value: name } });
    });
    return updatedResult.update();
  }
}
