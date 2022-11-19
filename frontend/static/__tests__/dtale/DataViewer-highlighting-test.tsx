import { act, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { DataViewer } from '../../dtale/DataViewer';
import * as serverState from '../../dtale/serverStateManagement';
import { RangeHighlightConfig } from '../../redux/state/AppState';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, clickMainMenuButton, findMainMenuButton } from '../test-utils';

describe('DataViewer highlighting tests', () => {
  let container: Element;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });
  let saveRangeHighlightsSpy: jest.SpyInstance<serverState.BaseReturn, [string, RangeHighlightConfig]>;
  let store: Store;

  beforeAll(() => {
    dimensions.beforeAll();
  });

  beforeEach(async () => {
    (axios.get as any).mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
    saveRangeHighlightsSpy = jest.spyOn(serverState, 'saveRangeHighlights');
    saveRangeHighlightsSpy.mockResolvedValue(Promise.resolve({ success: true }));
    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '', hideShutdown: 'True', processes: '2' }, store);
    await act(() => {
      const result = render(
        <Provider store={store}>
          <DataViewer />
        </Provider>,
        { container: document.getElementById('content') ?? undefined },
      );
      container = result.container;
    });
  });

  afterEach(jest.resetAllMocks);

  afterAll(() => {
    dimensions.afterAll();
    jest.restoreAllMocks();
  });

  const heatMapBtn = (): Element => findMainMenuButton('By Col', 'div.btn-group')!;
  const dataViewer = (): Element => container.getElementsByClassName('main-grid')[0];
  const allRange = (): Element => {
    const formGroups = document.body.getElementsByClassName('range')[0].getElementsByClassName('form-group');
    return formGroups[formGroups.length - 1];
  };

  it('DataViewer: heatmap', async () => {
    await act(async () => {
      fireEvent.click(heatMapBtn().getElementsByTagName('button')[0]);
    });
    expect(store.getState().settings.backgroundMode).toBe('heatmap-col');
    expect(
      [...dataViewer().getElementsByClassName('cell')].filter((c) => !window.getComputedStyle(c).background),
    ).toHaveLength(0);
    expect(
      screen.queryAllByTestId('header-cell').map((hc) => hc.getElementsByClassName('text-nowrap')[0].textContent),
    ).toEqual(['col1', 'col2']);
    await act(async () => {
      const buttons = heatMapBtn().getElementsByTagName('button');
      fireEvent.click(buttons[buttons.length - 1]);
    });
    expect(store.getState().settings.backgroundMode).toBe('heatmap-all');
    expect(
      screen.queryAllByTestId('header-cell').map((hc) => hc.getElementsByClassName('text-nowrap')[0].textContent),
    ).toEqual(['col1', 'col2']);
    await act(async () => {
      const buttons = heatMapBtn().getElementsByTagName('button');
      fireEvent.click(buttons[buttons.length - 1]);
    });
    expect(store.getState().settings.backgroundMode).toBe(undefined);
    expect(screen.queryAllByTestId('header-cell')).toHaveLength(4);
    expect(
      [...dataViewer().getElementsByClassName('cell')].filter((c) => window.getComputedStyle(c).background),
    ).toHaveLength(0);
  });

  it('DataViewer: dtype highlighting', async () => {
    await clickMainMenuButton('Highlight Dtypes');
    expect(store.getState().settings.backgroundMode).toBe('dtypes');
    await clickMainMenuButton('Highlight Dtypes');
    expect(store.getState().settings.backgroundMode).toBe(undefined);
  });

  it('DataViewer: missing highlighting', async () => {
    await clickMainMenuButton('Highlight Missing');
    expect(store.getState().settings.backgroundMode).toBe('missing');
    await clickMainMenuButton('Highlight Missing');
    expect(store.getState().settings.backgroundMode).toBe(undefined);
  });

  it('DataViewer: outlier highlighting', async () => {
    await clickMainMenuButton('Highlight Outliers');
    expect(store.getState().settings.backgroundMode).toBe('outliers');
    await clickMainMenuButton('Highlight Outliers');
    expect(store.getState().settings.backgroundMode).toBe(undefined);
  });

  const updateRangeHighlightInputs = async (idx: number): Promise<void> => {
    await act(async () => {
      const formGroups = document.body.getElementsByClassName('range')[0].getElementsByClassName('form-group');
      fireEvent.click(formGroups[idx].getElementsByTagName('i')[0]);
    });
    await act(async () => {
      const formGroups = document.body.getElementsByClassName('range')[0].getElementsByClassName('form-group');
      fireEvent.change(formGroups[idx].getElementsByTagName('input')[0], { target: { value: '3' } });
    });
  };

  it('DataViewer: range highlighting', async () => {
    await clickMainMenuButton('Highlight Range');
    await updateRangeHighlightInputs(1);
    await updateRangeHighlightInputs(2);
    await updateRangeHighlightInputs(3);
    await act(async () => {
      const formGroups = document.body.getElementsByClassName('range')[0].getElementsByClassName('form-group');
      fireEvent.click(formGroups[4].getElementsByTagName('button')[0]);
    });
    expect(saveRangeHighlightsSpy).toHaveBeenCalledTimes(1);
    expect(store.getState().settings.backgroundMode).toBe('range');
    expect(store.getState().settings.rangeHighlight).toStrictEqual(saveRangeHighlightsSpy.mock.calls[0][1]);
    await act(async () => {
      const menu = screen.getByTestId('data-viewer-menu');
      const menuItems = menu.querySelectorAll(`ul li`);
      const highlightItem = [...menuItems].find((b) => b?.textContent?.includes('Highlight Range'))!;
      fireEvent.click(highlightItem.getElementsByTagName('i')[0]);
    });
    expect(store.getState().settings.backgroundMode).toBe(undefined);
    expect(store.getState().settings.rangeHighlight.all.active).toBe(false);
    await clickMainMenuButton('Highlight Range');
    await act(async () => {
      fireEvent.click(allRange().getElementsByClassName('ico-check-box-outline-blank')[0]);
    });
    expect(store.getState().settings.rangeHighlight.all.active).toBe(true);
    await act(async () => {
      fireEvent.click(allRange().getElementsByClassName('ico-check-box')[0]);
    });
    expect(store.getState().settings.rangeHighlight.all.active).toBe(false);
    await act(async () => {
      fireEvent.click(allRange().getElementsByClassName('ico-remove-circle')[0]);
    });
    expect(Object.keys(store.getState().settings.rangeHighlight)).toHaveLength(0);
  });

  it('DataViewer: low variance highlighting', async () => {
    await clickMainMenuButton('Low Variance Flag');
    expect(store.getState().settings.backgroundMode).toBe('lowVariance');
    await clickMainMenuButton('Low Variance Flag');
    expect(store.getState().settings.backgroundMode).toBe(undefined);
  });
});
