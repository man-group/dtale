import { act, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';

import CreateColumn from '../../../popups/create/CreateColumn';
import { CreateColumnSaveParams, CreateColumnType, SaveAs } from '../../../popups/create/CreateColumnState';
import { ActionType } from '../../../redux/actions/AppActions';
import { PopupType } from '../../../redux/state/AppState';
import * as CreateColumnRepository from '../../../repository/CreateColumnRepository';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML } from '../../test-utils';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

/** Bundles alot of jest setup for CreateColumn component tests */
export class Spies {
  public saveSpy: jest.SpyInstance<
    Promise<CreateColumnRepository.SaveResponse | undefined>,
    [dataId: string, params: CreateColumnSaveParams, route?: string]
  >;
  public propagateStateSpy: jest.Mock;
  public mockDispatch = jest.fn();
  private useDispatchMock = useDispatch as jest.Mock;
  private result?: Element;

  /** Initializes all spy instances */
  constructor() {
    this.saveSpy = jest.spyOn(CreateColumnRepository, 'save');
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
   * @return the wrapper for testing.
   */
  public async setupWrapper(): Promise<Element> {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    store.dispatch({
      type: ActionType.OPEN_CHART,
      chartData: { type: PopupType.BUILD, propagateState: this.propagateStateSpy, selectedCol: 'col1' },
    });
    return await act(async () => {
      this.result = render(
        <Provider store={store}>
          <CreateColumn propagateState={this.propagateStateSpy} />
        </Provider>,
        { container: document.getElementById('content') ?? undefined },
      ).container;
      return this.result;
    });
  }

  /**
   * Execute the "Save" button on CreateColumn.
   */
  public async executeSave(): Promise<void> {
    await act(async () => {
      const footer = this.result!.getElementsByClassName('modal-footer')[0];
      await fireEvent.click(footer.getElementsByTagName('button')[0]);
    });
  }

  /**
   * Find button with specific text within CreateColumn and simulate a click.
   *
   * @param name the name of the button to click
   */
  public async clickBuilder(name: string): Promise<void> {
    await act(async () => {
      fireEvent.click(screen.getByText(name));
    });
  }

  /**
   * Execute a save on the current column creation configuration and validate the configuration used.
   *
   * @param overrides column creation parameter overrides
   * @param dataId the identifier of the data instance we want to create a column for
   * @param route the API route to use for saving
   */
  public async validateCfg(
    overrides: Partial<CreateColumnSaveParams>,
    dataId = '1',
    route = 'build-column',
  ): Promise<void> {
    await this.executeSave();
    let name: string | undefined = 'col';
    if (overrides.hasOwnProperty('name') && overrides.name === undefined) {
      name = undefined;
    } else if (overrides.name) {
      name = overrides.name;
    }
    expect(this.saveSpy).toHaveBeenLastCalledWith(
      dataId,
      {
        cfg: {},
        saveAs: SaveAs.NEW,
        type: CreateColumnType.NUMERIC,
        ...overrides,
        ...(name ? {} : { name }),
      },
      route,
    );
  }
}
