import { act, fireEvent, render, RenderResult, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';

import { OutputType } from '../../../popups/create/CreateColumnState';
import Reshape from '../../../popups/reshape/Reshape';
import { ReshapeSaveParams, ReshapeType } from '../../../popups/reshape/ReshapeState';
import { ActionType } from '../../../redux/actions/AppActions';
import { PopupType } from '../../../redux/state/AppState';
import * as ReshapeRepository from '../../../repository/ReshapeRepository';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML } from '../../test-utils';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

/** Bundles alot of jest setup for Reshape component tests */
export class Spies {
  public saveSpy: jest.SpyInstance<
    Promise<ReshapeRepository.SaveResponse | undefined>,
    [dataId: string, params: ReshapeSaveParams]
  >;
  public mockDispatch = jest.fn();
  private useDispatchMock = useDispatch as jest.Mock;
  private result?: RenderResult;

  /** Initializes all spy instances */
  constructor() {
    this.saveSpy = jest.spyOn(ReshapeRepository, 'save');
  }

  /** Sets the mockImplementation/mockReturnValue for spy instances */
  public setupMockImplementations(): void {
    this.useDispatchMock.mockImplementation(() => this.mockDispatch);
    (axios.get as any).mockImplementation(async (url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
    this.saveSpy.mockResolvedValue({ success: true, data_id: '2' });
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
   * @return the wrapper for testing.
   */
  public async setupWrapper(): Promise<RenderResult> {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    store.dispatch({ type: ActionType.OPEN_CHART, chartData: { type: PopupType.RESHAPE } });
    return await act(async () => {
      this.result = render(
        <Provider store={store}>
          <Reshape />
        </Provider>,
        { container: document.getElementById('content') ?? undefined },
      );
      return this.result;
    });
  }

  /**
   * Execute the "Save" button on CreateColumn.
   *
   * @return the udpated wrapper.
   */
  public async executeSave(): Promise<void> {
    await act(async () => {
      await fireEvent.click(screen.getByText('Execute'));
    });
  }

  /**
   * Find button with specific text within Reshape and simulate a click.
   *
   * @param name the name of the button to click
   * @return the updated wrapper
   */
  public async clickBuilder(name: string): Promise<void> {
    const buttons = [...this.result!.container.getElementsByTagName('button')];
    const button = buttons.find((b) => b.textContent === name);
    await act(async () => {
      await fireEvent.click(button!);
    });
  }

  /**
   * Execute a save on the current reshape configuration and validate the configuration used.
   *
   * @param overrides reshape parameter overrides
   * @param dataId the identifier of the data instance we want to reshape
   * @return the updated wrapper
   */
  public async validateCfg(overrides: Partial<ReshapeSaveParams>, dataId = '1'): Promise<void> {
    await this.executeSave();
    expect(this.saveSpy).toHaveBeenLastCalledWith(dataId, {
      cfg: {},
      type: ReshapeType.PIVOT,
      output: OutputType.NEW,
      ...overrides,
    });
  }

  /**
   * Validate and error exists and it's message.
   *
   * @param error error message
   * @return the updated wrapper
   */
  public async validateError(error: string): Promise<void> {
    await act(async () => {
      await fireEvent.click(screen.getByText('Execute'));
    });
    expect(screen.getByText(error)).toBeDefined();
  }
}
