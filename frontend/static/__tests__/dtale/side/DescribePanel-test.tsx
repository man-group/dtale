import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';

import { createMockComponent } from '../../mocks/createMockComponent'; // eslint-disable-line import/order
jest.mock('../../../dtale/side/SidePanelButtons', () => ({
  __esModule: true,
  default: createMockComponent(),
}));
jest.mock('../../../popups/describe/Details', () => ({
  __esModule: true,
  default: createMockComponent(),
}));

import * as serverState from '../../../dtale/serverStateManagement';
import DescribePanel from '../../../dtale/side/DescribePanel';
import { ColumnNavigation } from '../../../popups/describe/ColumnNavigation';
import DtypesGrid from '../../../popups/describe/DtypesGrid';
import { ActionType } from '../../../redux/actions/AppActions';
import { DataViewerUpdateType, SidePanelType } from '../../../redux/state/AppState';
import { RemovableError } from '../../../RemovableError';
import * as DtypesRepository from '../../../repository/DtypesRepository';
import reduxUtils from '../../redux-test-utils';
import { tickUpdate } from '../../test-utils';

describe('DescribePanel', () => {
  let wrapper: ReactWrapper;
  const dispatchSpy = jest.fn();
  let useSelectorSpy: jest.SpyInstance;

  const buildMock = async (): Promise<void> => {
    wrapper = mount(<DescribePanel />);
    await act(async () => tickUpdate(wrapper));
    wrapper = wrapper.update();
  };

  beforeEach(async () => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
    useSelectorSpy = jest.spyOn(redux, 'useSelector');
    const useDispatchSpy = jest.spyOn(redux, 'useDispatch');
    useDispatchSpy.mockReturnValue(dispatchSpy);
    useSelectorSpy.mockReturnValue({ dataId: '1', visible: false });
    await buildMock();
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('renders successfully', () => {
    expect(wrapper.html()).toBe(null);
  });

  describe('loading details', () => {
    const { open } = window;

    beforeAll(() => {
      delete (window as any).open;
      window.open = jest.fn();
    });

    beforeEach(async () => {
      useSelectorSpy.mockReturnValue({ dataId: '1', column: 'col1', visible: true, view: SidePanelType.DESCRIBE });
      await buildMock();
    });

    afterAll(() => (window.open = open));

    it('loads details', () => {
      expect(wrapper.find(ColumnNavigation).props().selectedIndex).toEqual(reduxUtils.DTYPES.dtypes[0].index);
    });

    it('handles changing column', async () => {
      useSelectorSpy.mockReturnValue({ dataId: '1', column: 'col2', visible: true, view: SidePanelType.DESCRIBE });
      await buildMock();
      expect(wrapper.find(ColumnNavigation).props().selectedIndex).toEqual(reduxUtils.DTYPES.dtypes[1].index);
    });

    it('handles dtype loading error gracefully', async () => {
      const loadDtypesSpy = jest.spyOn(DtypesRepository, 'loadDtypes');
      loadDtypesSpy.mockResolvedValue({ error: 'dtype error', success: false, dtypes: [] });
      await buildMock();
      expect(wrapper.find(RemovableError)).toHaveLength(1);
      loadDtypesSpy.mockRestore();
    });
  });

  describe('loading show/hide columns', () => {
    let serverStateSpy: jest.SpyInstance;

    beforeEach(async () => {
      serverStateSpy = jest.spyOn(serverState, 'updateVisibility');
      serverStateSpy.mockImplementation(() => undefined);
      useSelectorSpy.mockReturnValue({ dataId: '1', visible: true, view: SidePanelType.SHOW_HIDE });
      await buildMock();
    });

    it('renders successfully', () => {
      expect(wrapper.find(DtypesGrid)).toHaveLength(1);
    });

    it('updates visibility correctly', async () => {
      await act(async () => {
        wrapper.find('button').first().simulate('click');
      });
      wrapper = wrapper.update();
      expect(serverStateSpy.mock.calls[0][0]).toBe('1');
      expect(serverStateSpy.mock.calls[0][1]).toEqual({
        col1: true,
        col2: true,
        col3: true,
        col4: true,
      });
      expect(dispatchSpy).toHaveBeenCalledWith({
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
