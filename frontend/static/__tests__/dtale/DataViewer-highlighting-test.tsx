import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import _ from 'lodash';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';

import { DataViewer, ReactDataViewer } from '../../dtale/DataViewer';
import { DataViewerProps, DataViewerState } from '../../dtale/DataViewerState';
import * as serverState from '../../dtale/serverStateManagement';
import RangeHighlight from '../../popups/RangeHighlight';
import { RangeHighlightConfig } from '../../redux/state/AppState';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, clickMainMenuButton, findMainMenuButton, tick, tickUpdate } from '../test-utils';

describe('DataViewer highlighting tests', () => {
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });
  let result: ReactWrapper;
  let saveRangeHighlightsSpy: jest.SpyInstance<serverState.BaseReturn, [string, RangeHighlightConfig]>;

  beforeAll(() => {
    dimensions.beforeAll();
  });

  beforeEach(async () => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
    saveRangeHighlightsSpy = jest.spyOn(serverState, 'saveRangeHighlights');
    saveRangeHighlightsSpy.mockResolvedValue(Promise.resolve({ success: true }));
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '', hideShutdown: 'True', processes: '2' }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById('content') ?? undefined },
    );
    await tick();
  });

  afterAll(() => {
    dimensions.afterAll();
    jest.restoreAllMocks();
  });

  const heatMapBtn = (): ReactWrapper => findMainMenuButton(result, 'By Col', 'div.btn-group');
  const dataViewer = (): ReactWrapper<DataViewerProps, DataViewerState> => result.find(ReactDataViewer);
  const allRange = (): ReactWrapper => result.find(RangeHighlight).find('div.form-group').last();

  it('DataViewer: heatmap', async () => {
    heatMapBtn().find('button').first().simulate('click');
    result.update();
    expect(
      _.every(
        dataViewer()
          .find('div.cell')
          .map((c) => _.includes(c.html(), 'background: rgb')),
      ),
    ).toBe(true);
    expect(
      dataViewer()
        .find('div.headerCell')
        .map((hc) => hc.find('.text-nowrap').text()),
    ).toEqual(['col1', 'col2']);
    heatMapBtn().find('button').last().simulate('click');
    expect(
      dataViewer()
        .find('div.headerCell')
        .map((hc) => hc.find('.text-nowrap').text()),
    ).toEqual(['col1', 'col2']);
    heatMapBtn().find('button').last().simulate('click');
    expect(_.filter(dataViewer().instance().state.columns, { visible: true }).length).toBe(5);
    expect(
      _.every(
        dataViewer()
          .find('div.cell')
          .map((c) => !_.includes(c.html(), 'background: rgb')),
      ),
    ).toBe(true);
  });

  it('DataViewer: dtype highlighting', async () => {
    await clickMainMenuButton(result, 'Highlight Dtypes');
    result.update();
    expect(dataViewer().instance().state.backgroundMode).toBe('dtypes');
    await clickMainMenuButton(result, 'Highlight Dtypes');
    result.update();
    expect(dataViewer().instance().state.backgroundMode).toBeNull();
  });

  it('DataViewer: missing highlighting', async () => {
    await clickMainMenuButton(result, 'Highlight Missing');
    result.update();
    expect(dataViewer().instance().state.backgroundMode).toBe('missing');
    await clickMainMenuButton(result, 'Highlight Missing');
    result.update();
    expect(dataViewer().instance().state.backgroundMode).toBeNull();
  });

  it('DataViewer: outlier highlighting', async () => {
    await clickMainMenuButton(result, 'Highlight Outliers');
    result.update();
    expect(dataViewer().instance().state.backgroundMode).toBe('outliers');
    await clickMainMenuButton(result, 'Highlight Outliers');
    result.update();
    expect(dataViewer().instance().state.backgroundMode).toBeNull();
  });

  const updateRangeHighlightInputs = async (idx: number): Promise<void> => {
    result.find(RangeHighlight).find('div.form-group').at(idx);
    await act(async () => {
      result.find(RangeHighlight).find('div.form-group').at(idx).find('i').simulate('click');
    });
    result = result.update();
    await act(async () => {
      result
        .find(RangeHighlight)
        .find('div.form-group')
        .at(idx)
        .find('input')
        .simulate('change', { target: { value: '3' } });
    });
    result = result.update();
  };

  it('DataViewer: range highlighting', async () => {
    const RangeHighlightOption = require('../../dtale/menu/RangeHighlightOption').default;
    await clickMainMenuButton(result, 'Highlight Range');
    result.update();

    await updateRangeHighlightInputs(1);
    await updateRangeHighlightInputs(2);
    await updateRangeHighlightInputs(3);
    await act(async () => {
      result.find(RangeHighlight).find('div.form-group').at(4).find('button').simulate('click');
    });
    result = result.update();
    expect(saveRangeHighlightsSpy).toHaveBeenCalledTimes(1);
    expect(dataViewer().instance().state.backgroundMode).toBe('range');
    expect(dataViewer().instance().state.rangeHighlight).toStrictEqual(saveRangeHighlightsSpy.mock.calls[0][1]);
    result.find(RangeHighlightOption).find('i').simulate('click');
    result.update();
    expect(dataViewer().instance().state.backgroundMode).toBeNull();
    expect(dataViewer().instance().state.rangeHighlight).toStrictEqual(saveRangeHighlightsSpy.mock.calls[0][1]);
    await clickMainMenuButton(result, 'Highlight Range');
    result.update();
    await allRange().find('i.ico-check-box-outline-blank').simulate('click');
    await tickUpdate(result);
    expect(dataViewer().instance().state.rangeHighlight.all.active).toBe(true);
    await allRange().find('i.ico-check-box').simulate('click');
    await tickUpdate(result);
    expect(dataViewer().instance().state.rangeHighlight.all.active).toBe(false);
    await allRange().find('i.ico-remove-circle').simulate('click');
    await tickUpdate(result);
    expect(_.size(dataViewer().instance().state.rangeHighlight)).toBe(0);
  });

  it('DataViewer: low variance highlighting', async () => {
    await clickMainMenuButton(result, 'Low Variance Flag');
    result.update();
    expect(dataViewer().instance().state.backgroundMode).toBe('lowVariance');
    await clickMainMenuButton(result, 'Low Variance Flag');
    result.update();
    expect(dataViewer().instance().state.backgroundMode).toBeNull();
  });
});
