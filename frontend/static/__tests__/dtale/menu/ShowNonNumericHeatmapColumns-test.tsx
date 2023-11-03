import { act, fireEvent, render } from '@testing-library/react';
import * as React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { default as ShowNonNumericHeatmapColumns } from '../../../dtale/menu/ShowNonNumericHeatmapColumns';
import { ActionType } from '../../../redux/actions/AppActions';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML } from '../../test-utils';

describe('ShowNonNumericHeatmapColumns tests', () => {
  let result: Element;
  let store: Store;

  const setupOption = async (backgroundMode?: string, showAllHeatmapColumns = false): Promise<void> => {
    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    store.dispatch({ type: ActionType.UPDATE_SHOW_ALL_HEATMAP_COLUMNS, showAllHeatmapColumns });
    store.dispatch({ type: ActionType.UPDATE_SETTINGS, settings: { backgroundMode } });
    result = await act(() => {
      return render(
        <Provider store={store}>
          <ShowNonNumericHeatmapColumns />,
        </Provider>,
        {
          container: document.getElementById('content') ?? undefined,
        },
      ).container;
    });
  };

  beforeEach(async () => await setupOption());

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('renders successfully with defaults', () => {
    expect(result.getElementsByClassName('ico-check-box-outline-blank')).toHaveLength(1);
  });

  it('handles changes to checkbox', async () => {
    await act(() => {
      fireEvent.click(result.getElementsByClassName('ico-check-box-outline-blank')[0]);
    });
    expect(store.getState().showAllHeatmapColumns).toBe(true);
  });

  it('handles checkbox check w/ background', async () => {
    await setupOption('heatmap-col');
    await act(() => {
      fireEvent.click(result.getElementsByClassName('ico-check-box-outline-blank')[0]);
    });
    expect(store.getState().showAllHeatmapColumns).toBe(true);
    expect(store.getState().settings.backgroundMode).toBe('heatmap-col-all');
  });

  it('handles checkbox uncheck w/ background', async () => {
    await setupOption('heatmap-col-all', true);
    await act(() => {
      fireEvent.click(result.getElementsByClassName('ico-check-box')[0]);
    });
    expect(store.getState().showAllHeatmapColumns).toBe(false);
    expect(store.getState().settings.backgroundMode).toBe('heatmap-col');
  });
});
