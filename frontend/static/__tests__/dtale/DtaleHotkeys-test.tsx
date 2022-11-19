import { fireEvent, render } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';
import { Store } from 'redux';
import { default as configureStore } from 'redux-mock-store';

import { ColumnDef } from '../../dtale/DataViewerState';
import { DtaleHotkeys } from '../../dtale/DtaleHotkeys';
import * as menuUtils from '../../menuUtils';
import { ActionType } from '../../redux/actions/AppActions';
import { AppState, PopupType } from '../../redux/state/AppState';
import { mockColumnDef } from '../mocks/MockColumnDef';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML } from '../test-utils';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

const useDispatchMock = useDispatch as jest.Mock;

describe('DtaleHotkeys tests', () => {
  const { open, innerWidth, innerHeight } = window;
  const text = 'COPIED_TEXT';
  let container: HTMLElement;
  const mockDispatch = jest.fn();
  let buildClickHandlerSpy: jest.SpyInstance;
  const mockStore = configureStore();
  let store: Store;
  const openSpy = jest.fn();

  beforeAll(() => {
    delete (window as any).open;
    window.open = openSpy;
    window.innerHeight = 800;
    window.innerWidth = 1400;
  });

  const buildMock = async (columns: ColumnDef[] = [], appState?: Partial<AppState>): Promise<void> => {
    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    store = mockStore({
      ...store.getState(),
      ...appState,
    });

    container = render(
      <Provider store={store}>
        <DtaleHotkeys columns={columns} />
      </Provider>,
      { container: document.getElementById('content') ?? undefined },
    ).container;
  };

  beforeEach(async () => {
    useDispatchMock.mockImplementation(() => mockDispatch);
    buildClickHandlerSpy = jest.spyOn(menuUtils, 'buildClickHandler');
    (axios.get as any).mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
    (axios.post as any).mockResolvedValue({ data: { text, success: true } });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    window.open = open;
    window.innerHeight = innerHeight;
    window.innerWidth = innerWidth;
  });

  it('does not render when cell being edited', async () => {
    await buildMock([], { editedCell: 'true' });
    fireEvent.keyDown(container, { key: 'm' });
    fireEvent.keyDown(container, { keyCode: 16, shiftKey: true });
    fireEvent.keyUp(container, { key: 'm' });
    fireEvent.keyUp(container, { keyCode: 16, shiftKey: false });
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('sets state and fires click handler on menu open', async () => {
    await buildMock();
    fireEvent.keyDown(container, { key: 'm' });
    fireEvent.keyDown(container, { keyCode: 16, shiftKey: true });
    fireEvent.keyUp(container, { key: 'm' });
    fireEvent.keyUp(container, { keyCode: 16, shiftKey: true });
    expect(mockDispatch).toHaveBeenLastCalledWith({ type: ActionType.OPEN_MENU });
    expect(buildClickHandlerSpy.mock.calls).toHaveLength(1);
    buildClickHandlerSpy.mock.calls[0][0]();
    expect(mockDispatch).toHaveBeenLastCalledWith({ type: ActionType.CLOSE_MENU });
  });

  it('opens new tab on describe open', async () => {
    await buildMock();
    fireEvent.keyDown(container, { key: 'd' });
    fireEvent.keyDown(container, { keyCode: 16, shiftKey: true });
    fireEvent.keyUp(container, { key: 'd' });
    fireEvent.keyUp(container, { keyCode: 16, shiftKey: false });
    expect(openSpy).toHaveBeenLastCalledWith('/dtale/popup/describe/1', '_blank');
  });

  it('calls window.open on code export', async () => {
    await buildMock();
    fireEvent.keyDown(container, { key: 'x' });
    fireEvent.keyDown(container, { keyCode: 16, shiftKey: true });
    fireEvent.keyUp(container, { key: 'x' });
    fireEvent.keyUp(container, { keyCode: 16, shiftKey: false });
    expect(openSpy).toHaveBeenLastCalledWith(
      '/dtale/popup/code-export/1',
      '_blank',
      'titlebar=1,location=1,status=1,width=700,height=450',
    );
  });

  it('calls window.open on chart display', async () => {
    await buildMock();
    fireEvent.keyDown(container, { key: 'c' });
    fireEvent.keyDown(container, { keyCode: 16, shiftKey: true });
    fireEvent.keyUp(container, { key: 'c' });
    fireEvent.keyUp(container, { keyCode: 16, shiftKey: false });
    expect(openSpy).toHaveBeenLastCalledWith('/dtale/charts/1', '_blank');
  });

  it('calls openChart from redux', async () => {
    await buildMock();
    fireEvent.keyDown(container, { key: 'f' });
    fireEvent.keyDown(container, { keyCode: 16, shiftKey: true });
    fireEvent.keyUp(container, { key: 'f' });
    fireEvent.keyUp(container, { keyCode: 16, shiftKey: false });
    expect(mockDispatch).toHaveBeenLastCalledWith({
      type: ActionType.OPEN_CHART,
      chartData: { type: PopupType.FILTER, title: 'Filter', visible: true },
    });
  });

  it('calls build-column-copy for copy handler when ctrlCols exists', async () => {
    await buildMock([mockColumnDef(), mockColumnDef({ name: 'foo', index: 1 })], { ctrlCols: [1] });
    await fireEvent.keyDown(container, { key: 'c' });
    await fireEvent.keyDown(container, { keyCode: 17, ctrlKey: true });
    await fireEvent.keyUp(container, { key: 'c' });
    await fireEvent.keyUp(container, { keyCode: 17, ctrlKey: false });
    expect(axios.post).toBeCalledWith('/dtale/build-column-copy/1', { columns: `["foo"]` });
    expect(mockDispatch).toHaveBeenLastCalledWith({
      type: ActionType.OPEN_CHART,
      chartData: expect.objectContaining({
        text,
        headers: ['foo'],
        type: 'copy-column-range',
        title: 'Copy Columns to Clipboard?',
      }),
    });
  });

  it('calls build-row-copy for copy handler when ctrlRows exists', async () => {
    await buildMock([mockColumnDef({ name: 'foo' })], { ctrlRows: [1] });
    await fireEvent.keyDown(container, { key: 'c' });
    await fireEvent.keyDown(container, { keyCode: 17, ctrlKey: true });
    await fireEvent.keyUp(container, { key: 'c' });
    await fireEvent.keyUp(container, { keyCode: 17, ctrlKey: false });
    expect(axios.post).toBeCalledWith('/dtale/build-row-copy/1', { rows: '[0]', columns: `["foo"]` });
    expect(mockDispatch).toHaveBeenLastCalledWith({
      type: ActionType.OPEN_CHART,
      chartData: expect.objectContaining({
        text,
        headers: ['foo'],
        type: 'copy-row-range',
        title: 'Copy Rows to Clipboard?',
      }),
    });
  });
});
