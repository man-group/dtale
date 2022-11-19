import { act, fireEvent, render, RenderResult, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';
import { Store } from 'redux';
import { default as configureStore } from 'redux-mock-store';

jest.mock('../../../dtale/side/SidePanelButtons', () => {
  const { createMockComponent } = require('../../mocks/createMockComponent');
  return {
    __esModule: true,
    default: createMockComponent(),
  };
});

import * as serverState from '../../../dtale/serverStateManagement';
import DescribePanel from '../../../dtale/side/DescribePanel';
import { ActionType } from '../../../redux/actions/AppActions';
import { DataViewerUpdateType, SidePanelType } from '../../../redux/state/AppState';
import * as DtypesRepository from '../../../repository/DtypesRepository';
import reduxUtils from '../../redux-test-utils';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

const useDispatchMock = useDispatch as jest.Mock;

describe('DescribePanel', () => {
  let wrapper: RenderResult;
  const mockStore = configureStore();
  let store: Store;
  const mockDispatch = jest.fn();

  const buildMock = async (state?: { [key: string]: any }): Promise<void> => {
    store = mockStore({ dataId: '1', settings: {}, sidePanel: { visible: false }, ...state });
    wrapper = await act(async (): Promise<RenderResult> => {
      return render(
        <Provider store={store}>
          <DescribePanel />
        </Provider>,
      );
    });
  };

  beforeEach(async () => {
    useDispatchMock.mockImplementation(() => mockDispatch);
    (axios.get as any).mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('renders successfully', async () => {
    await buildMock();
    expect(wrapper.container.innerHTML).toBe('');
  });

  describe('loading details', () => {
    const { open } = window;

    beforeAll(() => {
      delete (window as any).open;
      window.open = jest.fn();
    });

    afterAll(() => (window.open = open));

    it('loads details', async () => {
      await buildMock({ dataId: '1', sidePanel: { column: 'col1', visible: true, view: SidePanelType.DESCRIBE } });
      expect(screen.getByTestId('details').getElementsByTagName('span')[0].textContent).toEqual(
        reduxUtils.DTYPES.dtypes[0].name,
      );
    });

    it('handles changing column', async () => {
      await buildMock({ dataId: '1', sidePanel: { column: 'col2', visible: true, view: SidePanelType.DESCRIBE } });
      expect(screen.getByTestId('details').getElementsByTagName('span')[0].textContent).toEqual(
        reduxUtils.DTYPES.dtypes[1].name,
      );
    });

    it('handles dtype loading error gracefully', async () => {
      const loadDtypesSpy = jest.spyOn(DtypesRepository, 'loadDtypes');
      loadDtypesSpy.mockResolvedValue({ error: 'dtype error', success: false, dtypes: [] });
      await buildMock({ dataId: '1', sidePanel: { column: 'col1', visible: true, view: SidePanelType.DESCRIBE } });
      expect(screen.getByRole('alert')).toBeDefined();
      loadDtypesSpy.mockRestore();
    });
  });

  describe('loading show/hide columns', () => {
    let serverStateSpy: jest.SpyInstance;

    beforeEach(async () => {
      serverStateSpy = jest.spyOn(serverState, 'updateVisibility');
      serverStateSpy.mockImplementation(() => undefined);
    });

    it('renders successfully', async () => {
      await buildMock({ dataId: '1', sidePanel: { visible: true, view: SidePanelType.SHOW_HIDE } });
      expect(screen.getByRole('grid')).toBeDefined();
    });

    it('updates visibility correctly', async () => {
      await buildMock({ dataId: '1', sidePanel: { visible: true, view: SidePanelType.SHOW_HIDE } });
      await act(async () => {
        fireEvent.click(wrapper.container.getElementsByTagName('button')[0]);
      });
      expect(serverStateSpy.mock.calls[0][0]).toBe('1');
      expect(serverStateSpy.mock.calls[0][1]).toEqual({
        col1: true,
        col2: true,
        col3: true,
        col4: true,
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: ActionType.DATA_VIEWER_UPDATE,
        update: {
          type: DataViewerUpdateType.TOGGLE_COLUMNS,
          columns: {
            col1: true,
            col2: true,
            col3: true,
            col4: true,
          },
        },
      });
    });
  });
});
