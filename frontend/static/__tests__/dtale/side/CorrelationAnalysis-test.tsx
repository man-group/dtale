import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';
import { Table } from 'react-virtualized';

import * as serverState from '../../../dtale/serverStateManagement';
import CorrelationAnalysis from '../../../dtale/side/CorrelationAnalysis';
import { ActionType } from '../../../redux/actions/AppActions';
import * as chartActions from '../../../redux/actions/charts';
import { ConfirmationPopupData, DataViewerUpdateType, PopupType } from '../../../redux/state/AppState';
import * as CorrelationsRepository from '../../../repository/CorrelationsRepository';
import { StyledSlider } from '../../../sliderUtils';
import DimensionsHelper from '../../DimensionsHelper';
import { tickUpdate } from '../../test-utils';

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
  let wrapper: ReactWrapper;
  let serverStateSpy: jest.SpyInstance;
  const dispatchSpy = jest.fn();
  const dimensions = new DimensionsHelper({
    offsetWidth: 1205,
    offsetHeight: 775,
  });

  beforeAll(() => dimensions.beforeAll());

  beforeEach(async () => {
    const useSelectorSpy = jest.spyOn(redux, 'useSelector');
    useSelectorSpy.mockReturnValue('1');
    const useDispatchSpy = jest.spyOn(redux, 'useDispatch');
    useDispatchSpy.mockReturnValue(dispatchSpy);
    const loadAnalysisSpy = jest.spyOn(CorrelationsRepository, 'loadAnalysis');
    loadAnalysisSpy.mockResolvedValue({ ...ANALYSIS, success: true });
    serverStateSpy = jest.spyOn(serverState, 'deleteColumns');
    serverStateSpy.mockResolvedValue(Promise.resolve({ success: true }));
    wrapper = mount(<CorrelationAnalysis />);
    await act(async () => tickUpdate(wrapper));
    wrapper = wrapper.update();
  });

  afterEach(jest.resetAllMocks);

  afterAll(() => {
    jest.restoreAllMocks();
    dimensions.afterAll();
  });

  it('renders successfully', () => {
    expect(wrapper.find(Table).props().rowCount).toBe(3);
  });

  it('handles sorts', async () => {
    await act(async () => {
      wrapper.find('div.headerCell.pointer').first().simulate('click');
    });
    wrapper = wrapper.update();
    expect(wrapper.find('div.headerCell.pointer').map((div) => div.text())).toEqual([
      '▲ Column',
      'Max Correlation w/ Other Columns',
      'Correlations\nAbove Threshold',
      'Missing Rows',
    ]);
    await act(async () => {
      wrapper.find('div.headerCell.pointer').first().simulate('click');
    });
    wrapper = wrapper.update();
    expect(wrapper.find('div.headerCell.pointer').map((div) => div.text())).toEqual([
      '▼ Column',
      'Max Correlation w/ Other Columns',
      'Correlations\nAbove Threshold',
      'Missing Rows',
    ]);
    await act(async () => {
      wrapper.find('div.headerCell.pointer').last().simulate('click');
    });
    wrapper = wrapper.update();
    expect(wrapper.find('div.headerCell.pointer').map((div) => div.text())).toEqual([
      'Column',
      'Max Correlation w/ Other Columns',
      'Correlations\nAbove Threshold',
      '▲ Missing Rows',
    ]);
  });

  it('handles deselection of columns', async () => {
    const openChartSpy = jest.spyOn(chartActions, 'openChart');
    await act(async () => {
      wrapper.find('i.ico-check-box').first().simulate('click');
    });
    wrapper = wrapper.update();
    expect(wrapper.find('i.ico-check-box-outline-blank')).toHaveLength(1);
    expect(wrapper.find('button.btn-primary')).toHaveLength(1);
    await act(async () => {
      wrapper.find('button.btn-primary').first().simulate('click');
    });
    wrapper = wrapper.update();
    expect(openChartSpy).toHaveBeenLastCalledWith(expect.objectContaining({ type: PopupType.CONFIRM }));
    await act(async () => {
      (openChartSpy.mock.calls[0][0] as ConfirmationPopupData).yesAction?.();
    });
    wrapper = wrapper.update();
    expect(serverStateSpy).toHaveBeenCalledWith('1', ['foo']);
    expect(dispatchSpy).toHaveBeenCalledWith({
      type: ActionType.DATA_VIEWER_UPDATE,
      update: { type: DataViewerUpdateType.DROP_COLUMNS, columns: ['foo'] },
    });
    expect(dispatchSpy).toHaveBeenLastCalledWith({ type: ActionType.HIDE_SIDE_PANEL });
  });

  it('handles threshold updates', async () => {
    await act(async () => {
      wrapper.find(StyledSlider).props().onAfterChange(0.25);
    });
    wrapper = wrapper.update();
    expect(wrapper.find(Table).props().rowCount).toBe(3);
  });
});
