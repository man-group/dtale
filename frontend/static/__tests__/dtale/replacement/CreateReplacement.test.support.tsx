import { act, fireEvent, render, RenderResult, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';

import { SaveAs } from '../../../popups/create/CreateColumnState';
import CreateReplacement from '../../../popups/replacement/CreateReplacement';
import { CreateReplacementSaveParams, ReplacementType } from '../../../popups/replacement/CreateReplacementState';
import { ActionType } from '../../../redux/actions/AppActions';
import { PopupType } from '../../../redux/state/AppState';
import * as CreateReplacementRepository from '../../../repository/CreateReplacementRepository';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML } from '../../test-utils';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

/** Bundles alot of jest setup for CreateColumn component tests */
export class Spies {
  public saveSpy: jest.SpyInstance<
    Promise<CreateReplacementRepository.SaveResponse | undefined>,
    [dataId: string, params: CreateReplacementSaveParams]
  >;
  public propagateStateSpy: jest.Mock;
  public mockDispatch = jest.fn();
  private useDispatchMock = useDispatch as jest.Mock;
  private result?: RenderResult;

  /** Initializes all spy instances */
  constructor() {
    this.saveSpy = jest.spyOn(CreateReplacementRepository, 'save');
    this.propagateStateSpy = jest.fn();
  }

  /** Sets the mockImplementation/mockReturnValue for spy instances */
  public setupMockImplementations(): void {
    this.useDispatchMock.mockImplementation(() => this.mockDispatch);
    (axios.get as any).mockImplementation(async (url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
    this.saveSpy.mockResolvedValue({ success: true });
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
   * @param overrides overrides for chart popup
   * @return the wrapper for testing.
   */
  public async setupWrapper(overrides?: Record<string, any>): Promise<RenderResult> {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    store.dispatch({
      type: ActionType.OPEN_CHART,
      chartData: {
        type: PopupType.REPLACEMENT,
        propagateState: this.propagateStateSpy,
        selectedCol: 'col1',
        ...overrides,
      },
    });
    return await act(async () => {
      this.result = render(
        <Provider store={store}>
          <CreateReplacement />
        </Provider>,
        { container: document.getElementById('content') ?? undefined },
      );
      return this.result;
    });
  }

  /**
   * Execute the "Save" button on CreateColumn.
   */
  public async executeSave(): Promise<void> {
    await act(async () => {
      await fireEvent.click(screen.getByText('Replace'));
    });
  }

  /**
   * Find button with specific text within CreateColumn and simulate a click.
   *
   * @param name the name of the button to click
   */
  public async clickBuilder(name: string): Promise<void> {
    const buttons = [...this.result!.container.getElementsByTagName('button')];
    const button = buttons.find((b) => b.textContent === name);
    await act(async () => {
      await fireEvent.click(button!);
    });
  }

  /**
   * Execute a save on the current column replacement configuration and validate the configuration used.
   *
   * @param overrides column replacement parameter overrides
   * @param dataId the identifier of the data instance we want to create a column for
   */
  public async validateCfg(overrides: Partial<CreateReplacementSaveParams>, dataId = '1'): Promise<void> {
    await this.executeSave();
    expect(this.saveSpy).toHaveBeenLastCalledWith(dataId, {
      cfg: {},
      saveAs: SaveAs.NEW,
      type: ReplacementType.IMPUTER,
      ...overrides,
    });
  }

  /**
   * Update the name of the replacement being created
   * @param name the name to apply
   */
  public async setName(name: string): Promise<void> {
    await act(async () => {
      fireEvent.click(screen.getByText('New Column'));
    });
    await act(async () => {
      fireEvent.change(screen.getByTestId('new-column-name'), { target: { value: name } });
    });
  }
}
