import { act, fireEvent, render } from '@testing-library/react';
import * as React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { default as HeatMapOption, HeatMapOptionProps } from '../../../dtale/menu/HeatMapOption';
import { ActionType } from '../../../redux/actions/AppActions';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML } from '../../test-utils';

describe('HeatMapOption tests', () => {
  let result: Element;
  let props: HeatMapOptionProps;
  const toggleBackgroundSpy = jest.fn();
  let store: Store;

  const setupOption = async (
    propOverrides?: Partial<HeatMapOptionProps>,
    showAllHeatmapColumns = false,
  ): Promise<void> => {
    props = {
      toggleBackground: toggleBackgroundSpy,
      ...propOverrides,
    };
    store = reduxUtils.createDtaleStore();
    store.dispatch({ type: ActionType.UPDATE_SHOW_ALL_HEATMAP_COLUMNS, showAllHeatmapColumns });
    buildInnerHTML({ settings: '' }, store);
    result = await act(
      () =>
        render(
          <Provider store={store}>
            <HeatMapOption {...props} />,
          </Provider>,
          {
            container: document.getElementById('content') as HTMLElement,
          },
        ).container,
    );
  };

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('renders successfully with defaults', async () => {
    await setupOption();
    const buttons = [...result.getElementsByTagName('button')];
    expect(buttons.map((b) => b.textContent)).toEqual(['By Col', 'Overall']);
    await act(() => {
      fireEvent.click(buttons[0]);
    });
    expect(toggleBackgroundSpy).toHaveBeenLastCalledWith('heatmap-col');
    await act(() => {
      fireEvent.click(buttons[buttons.length - 1]);
    });
    expect(toggleBackgroundSpy).toHaveBeenLastCalledWith('heatmap-all');
  });

  it('handles background updates w/ all columns displayed', async () => {
    await setupOption({}, true);
    const buttons = [...result.getElementsByTagName('button')];
    await act(() => {
      fireEvent.click(buttons[0]);
    });
    expect(toggleBackgroundSpy).toHaveBeenLastCalledWith('heatmap-col-all');
    await act(() => {
      fireEvent.click(buttons[buttons.length - 1]);
    });
    expect(toggleBackgroundSpy).toHaveBeenLastCalledWith('heatmap-all-all');
  });
});
