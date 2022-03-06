import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { DataViewer } from '../../dtale/DataViewer';
import { ColumnDef } from '../../dtale/DataViewerState';
import DataViewerMenu from '../../dtale/menu/DataViewerMenu';
import RangeHighlightOption from '../../dtale/menu/RangeHighlightOption';
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
  let store: Store;

  beforeAll(() => {
    dimensions.beforeAll();
  });

  beforeEach(async () => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
    saveRangeHighlightsSpy = jest.spyOn(serverState, 'saveRangeHighlights');
    saveRangeHighlightsSpy.mockResolvedValue(Promise.resolve({ success: true }));
    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '', hideShutdown: 'True', processes: '2' }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById('content') ?? undefined },
    );
    await act(async () => tickUpdate(result));
    result = result.update();
  });

  afterEach(jest.resetAllMocks);

  afterAll(() => {
    dimensions.afterAll();
    jest.restoreAllMocks();
  });

  const heatMapBtn = (): ReactWrapper => findMainMenuButton(result, 'By Col', 'div.btn-group');
  const dataViewer = (): ReactWrapper => result.find(DataViewer);
  const allRange = (): ReactWrapper => result.find(RangeHighlight).find('div.form-group').last();

  it('DataViewer: heatmap', async () => {
    await act(async () => {
      heatMapBtn().find('button').first().simulate('click');
    });
    result = result.update();
    expect(store.getState().settings.backgroundMode).toBe('heatmap-col');
    expect(
      dataViewer()
        .find('div.cell')
        .filterWhere((c) => !c.props().style?.hasOwnProperty('background')),
    ).toHaveLength(0);
    expect(
      dataViewer()
        .find('div.headerCell')
        .map((hc) => hc.find('.text-nowrap').text()),
    ).toEqual(['col1', 'col2']);
    await act(async () => {
      heatMapBtn().find('button').last().simulate('click');
    });
    result = result.update();
    expect(store.getState().settings.backgroundMode).toBe('heatmap-all');
    expect(
      dataViewer()
        .find('div.headerCell')
        .map((hc) => hc.find('.text-nowrap').text()),
    ).toEqual(['col1', 'col2']);
    await act(async () => {
      heatMapBtn().find('button').last().simulate('click');
    });
    result = result.update();
    expect(store.getState().settings.backgroundMode).toBe(undefined);
    expect(
      dataViewer()
        .find(DataViewerMenu)
        .props()
        .columns.filter((col: ColumnDef) => col.visible).length,
    ).toBe(5);
    expect(
      dataViewer()
        .find('div.cell')
        .filterWhere((c) => c.props().style?.hasOwnProperty('background') === true),
    ).toHaveLength(0);
  });

  it('DataViewer: dtype highlighting', async () => {
    result = await clickMainMenuButton(result, 'Highlight Dtypes');
    expect(store.getState().settings.backgroundMode).toBe('dtypes');
    result = await clickMainMenuButton(result, 'Highlight Dtypes');
    expect(store.getState().settings.backgroundMode).toBe(undefined);
  });

  it('DataViewer: missing highlighting', async () => {
    result = await clickMainMenuButton(result, 'Highlight Missing');
    expect(store.getState().settings.backgroundMode).toBe('missing');
    result = await clickMainMenuButton(result, 'Highlight Missing');
    expect(store.getState().settings.backgroundMode).toBe(undefined);
  });

  it('DataViewer: outlier highlighting', async () => {
    result = await clickMainMenuButton(result, 'Highlight Outliers');
    expect(store.getState().settings.backgroundMode).toBe('outliers');
    result = await clickMainMenuButton(result, 'Highlight Outliers');
    expect(store.getState().settings.backgroundMode).toBe(undefined);
  });

  const updateRangeHighlightInputs = async (idx: number): Promise<void> => {
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
    result = await clickMainMenuButton(result, 'Highlight Range');
    await updateRangeHighlightInputs(1);
    await updateRangeHighlightInputs(2);
    await updateRangeHighlightInputs(3);
    await act(async () => {
      result.find(RangeHighlight).find('div.form-group').at(4).find('button').simulate('click');
    });
    result = result.update();
    expect(saveRangeHighlightsSpy).toHaveBeenCalledTimes(1);
    expect(store.getState().settings.backgroundMode).toBe('range');
    expect(store.getState().settings.rangeHighlight).toStrictEqual(saveRangeHighlightsSpy.mock.calls[0][1]);
    await act(async () => {
      result.find(RangeHighlightOption).find('i').simulate('click');
    });
    result = result.update();
    await tick();
    result = result.update();
    expect(store.getState().settings.backgroundMode).toBe(undefined);
    expect(store.getState().settings.rangeHighlight.all.active).toBe(false);
    result = await clickMainMenuButton(result, 'Highlight Range');
    await act(async () => {
      allRange().find('i.ico-check-box-outline-blank').simulate('click');
    });
    result = result.update();
    expect(store.getState().settings.rangeHighlight.all.active).toBe(true);
    await act(async () => {
      allRange().find('i.ico-check-box').simulate('click');
    });
    result = result.update();
    expect(store.getState().settings.rangeHighlight.all.active).toBe(false);
    await act(async () => {
      allRange().find('i.ico-remove-circle').simulate('click');
    });
    result = result.update();
    expect(Object.keys(store.getState().settings.rangeHighlight)).toHaveLength(0);
  });

  it('DataViewer: low variance highlighting', async () => {
    result = await clickMainMenuButton(result, 'Low Variance Flag');
    expect(store.getState().settings.backgroundMode).toBe('lowVariance');
    result = await clickMainMenuButton(result, 'Low Variance Flag');
    expect(store.getState().settings.backgroundMode).toBe(undefined);
  });
});
