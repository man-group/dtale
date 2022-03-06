import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { GlobalHotKeys } from 'react-hotkeys';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { ColumnDef } from '../../dtale/DataViewerState';
import { DtaleHotkeys } from '../../dtale/DtaleHotkeys';
import * as menuUtils from '../../menuUtils';
import { AppState } from '../../redux/state/AppState';
import { mockColumnDef } from '../mocks/MockColumnDef';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, tickUpdate } from '../test-utils';

describe('DtaleHotkeys tests', () => {
  const { open, innerWidth, innerHeight } = window;
  const text = 'COPIED_TEXT';
  let result: ReactWrapper;
  let buildClickHandlerSpy: jest.SpyInstance;
  let axiosPostSpy: jest.SpyInstance;
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
    Object.keys(appState ?? {}).forEach((key) => (store.getState()[key] = (appState as any)[key]));
    result = mount(
      <Provider store={store}>
        <DtaleHotkeys columns={columns} />
      </Provider>,
      { attachTo: document.getElementById('content') ?? undefined },
    );
    await act(async () => await tickUpdate(result));
    result = result.update();
  };

  beforeEach(async () => {
    buildClickHandlerSpy = jest.spyOn(menuUtils, 'buildClickHandler');
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
    axiosPostSpy = jest.spyOn(axios, 'post');
    axiosPostSpy.mockResolvedValue({ data: { text, success: true } });
    await buildMock();
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

  it('renders GlobalHotKeys', () => {
    expect(result.find(GlobalHotKeys).length).toBe(1);
  });

  it('does not render when cell being edited', async () => {
    await buildMock([], { editedCell: 'true' });
    expect(result.find(GlobalHotKeys).length).toBe(0);
  });

  it('sets state and fires click handler on menu open', async () => {
    const hotkeys = result.find(GlobalHotKeys);
    const menuHandler = hotkeys.prop('handlers')?.MENU;
    await act(async () => {
      menuHandler?.();
    });
    result = result.update();
    expect(store.getState().menuOpen).toBe(true);
    expect(buildClickHandlerSpy.mock.calls).toHaveLength(1);
    buildClickHandlerSpy.mock.calls[0][0]();
    expect(store.getState().menuOpen).toBe(false);
  });

  it('opens new tab on describe open', async () => {
    const hotkeys = result.find(GlobalHotKeys);
    const describeHandler = hotkeys.prop('handlers')?.DESCRIBE;
    await act(async () => {
      describeHandler?.();
    });
    result = result.update();
    expect(openSpy).toHaveBeenLastCalledWith('/dtale/popup/describe/1', '_blank');
  });

  it('calls window.open on code export', async () => {
    const hotkeys = result.find(GlobalHotKeys);
    const codeHandler = hotkeys.prop('handlers')?.CODE;
    await act(async () => {
      codeHandler?.();
    });
    result = result.update();
    expect(openSpy).toHaveBeenLastCalledWith(
      '/dtale/popup/code-export/1',
      '_blank',
      'titlebar=1,location=1,status=1,width=700,height=450',
    );
  });

  it('calls window.open on chart display', async () => {
    const hotkeys = result.find(GlobalHotKeys);
    const chartsHandler = hotkeys.prop('handlers')?.CHARTS;
    await act(async () => {
      chartsHandler?.();
    });
    result = result.update();
    expect(openSpy).toHaveBeenLastCalledWith('/dtale/charts/1', '_blank');
  });

  it('calls openChart from redux', async () => {
    const hotkeys = result.find(GlobalHotKeys);
    const filterHandler = hotkeys.prop('handlers')?.FILTER;
    await act(async () => {
      filterHandler?.();
    });
    result = result.update();
    expect(store.getState().chartData).toEqual(
      expect.objectContaining({
        type: 'filter',
        visible: true,
      }),
    );
  });

  it('calls build-column-copy for copy handler when ctrlCols exists', async () => {
    await buildMock([mockColumnDef(), mockColumnDef({ name: 'foo', index: 1 })], { ctrlCols: [1] });
    const hotkeys = result.find(GlobalHotKeys);
    const copyHandler = hotkeys.prop('handlers')?.COPY;
    await act(async () => {
      copyHandler?.();
    });
    result = result.update();
    expect(axiosPostSpy).toBeCalledWith('/dtale/build-column-copy/1', { columns: `["foo"]` });
    expect(store.getState().chartData).toEqual(
      expect.objectContaining({
        text,
        headers: ['foo'],
        type: 'copy-column-range',
        title: 'Copy Columns to Clipboard?',
      }),
    );
  });

  it('calls build-row-copy for copy handler when ctrlRows exists', async () => {
    await buildMock([mockColumnDef({ name: 'foo' })], { ctrlRows: [1] });
    const hotkeys = result.find(GlobalHotKeys);
    const copyHandler = hotkeys.prop('handlers')?.COPY;
    await act(async () => {
      copyHandler?.();
    });
    result = result.update();
    expect(axiosPostSpy).toBeCalledWith('/dtale/build-row-copy/1', { rows: '[0]', columns: `["foo"]` });
    expect(store.getState().chartData).toEqual(
      expect.objectContaining({
        text,
        headers: ['foo'],
        type: 'copy-row-range',
        title: 'Copy Rows to Clipboard?',
      }),
    );
  });
});
