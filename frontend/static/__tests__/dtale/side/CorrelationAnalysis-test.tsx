import { act, fireEvent, render, RenderResult, screen } from '@testing-library/react';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';
import { Store } from 'redux';
import { default as configureStore } from 'redux-mock-store';

import * as serverState from '../../../dtale/serverStateManagement';
import CorrelationAnalysis from '../../../dtale/side/CorrelationAnalysis';
import { ActionType } from '../../../redux/actions/AppActions';
import * as chartActions from '../../../redux/actions/charts';
import { ConfirmationPopupData, DataViewerUpdateType, PopupType } from '../../../redux/state/AppState';
import * as CorrelationsRepository from '../../../repository/CorrelationsRepository';
import DimensionsHelper from '../../DimensionsHelper';
import { FakeMouseEvent } from '../../test-utils';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

const useDispatchMock = useDispatch as jest.Mock;

const ANALYSIS = {
  ranks: [
    { column: 'foo', score: 0.5, missing: 0 },
    { column: 'bar', score: 0.25, missing: 10 },
    { column: 'baz', score: null, missing: 5 },
  ],
  corrs: {
    foo: { bar: 0.5, baz: null },
    bar: { foo: 0.15, baz: null },
    baz: { foo: 0.25, bar: 0.25 },
  },
  column_name: 'foo',
  max_score: 'N/A',
};

describe('CorrelationAnalysis', () => {
  let wrapper: RenderResult;
  const mockStore = configureStore();
  let store: Store;
  const mockDispatch = jest.fn();
  let serverStateSpy: jest.SpyInstance;
  const dimensions = new DimensionsHelper({
    offsetWidth: 1205,
    offsetHeight: 775,
  });

  beforeAll(() => dimensions.beforeAll());

  beforeEach(async () => {
    (Element.prototype as any).getBoundingClientRect = jest.fn(() => {
      return {
        width: 0,
        height: 100,
        top: 0,
        left: 0,
        bottom: 0,
        right: 10,
      };
    });
    useDispatchMock.mockImplementation(() => mockDispatch);
    const loadAnalysisSpy = jest.spyOn(CorrelationsRepository, 'loadAnalysis');
    loadAnalysisSpy.mockResolvedValue({ ...ANALYSIS, success: true });
    serverStateSpy = jest.spyOn(serverState, 'deleteColumns');
    serverStateSpy.mockResolvedValue(Promise.resolve({ success: true }));
    store = mockStore({ dataId: '1' });
    wrapper = await act(async (): Promise<RenderResult> => {
      return render(
        <Provider store={store}>
          <CorrelationAnalysis />
        </Provider>,
      );
    });
  });

  afterEach(jest.resetAllMocks);

  afterAll(() => {
    jest.restoreAllMocks();
    dimensions.afterAll();
  });

  it('renders successfully', () => {
    expect(screen.getByRole('grid').getAttribute('aria-rowcount')).toBe('3');
  });

  it('handles sorts', async () => {
    await act(async () => {
      fireEvent.click(wrapper.container.querySelector('div.headerCell.pointer')!);
    });
    expect([...wrapper.container.querySelectorAll('div.headerCell.pointer')].map((div) => div.textContent)).toEqual([
      '▲ Column',
      'Max Correlation w/ Other Columns',
      'Correlations\nAbove Threshold',
      'Missing Rows',
    ]);
    await act(async () => {
      fireEvent.click(wrapper.container.querySelector('div.headerCell.pointer')!);
    });
    expect([...wrapper.container.querySelectorAll('div.headerCell.pointer')].map((div) => div.textContent)).toEqual([
      '▼ Column',
      'Max Correlation w/ Other Columns',
      'Correlations\nAbove Threshold',
      'Missing Rows',
    ]);
    await act(async () => {
      const headers = wrapper.container.querySelectorAll('div.headerCell.pointer');
      fireEvent.click(headers[headers.length - 1]);
    });
    expect([...wrapper.container.querySelectorAll('div.headerCell.pointer')].map((div) => div.textContent)).toEqual([
      'Column',
      'Max Correlation w/ Other Columns',
      'Correlations\nAbove Threshold',
      '▲ Missing Rows',
    ]);
  });

  it('handles deselection of columns', async () => {
    const openChartSpy = jest.spyOn(chartActions, 'openChart');
    await act(async () => {
      fireEvent.click(wrapper.container.querySelector('i.ico-check-box')!);
    });
    expect(wrapper.container.querySelector('i.ico-check-box-outline-blank')).toBeDefined();
    expect(wrapper.container.querySelector('button.btn-primary')).toBeDefined();
    await act(async () => {
      fireEvent.click(wrapper.container.querySelector('button.btn-primary')!);
    });
    expect(openChartSpy).toHaveBeenLastCalledWith(expect.objectContaining({ type: PopupType.CONFIRM }));
    await act(async () => {
      (openChartSpy.mock.calls[0][0] as ConfirmationPopupData).yesAction?.();
    });
    expect(serverStateSpy).toHaveBeenCalledWith('1', ['foo']);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: ActionType.DATA_VIEWER_UPDATE,
      update: { type: DataViewerUpdateType.DROP_COLUMNS, columns: ['foo'] },
    });
    expect(mockDispatch).toHaveBeenLastCalledWith({ type: ActionType.HIDE_SIDE_PANEL });
  });

  it('handles threshold updates', async () => {
    const thumb = screen.getByRole('slider');
    await act(async () => {
      await fireEvent(thumb, new FakeMouseEvent('mousedown', { bubbles: true, pageX: 0, pageY: 0 }));
    });
    await act(async () => {
      await fireEvent(thumb, new FakeMouseEvent('mousemove', { bubbles: true, pageX: 50, pageY: 0 }));
    });
    await act(async () => {
      await fireEvent.mouseUp(thumb);
    });
    expect(screen.getByRole('grid').getAttribute('aria-rowcount')).toBe('3');
  });
});
