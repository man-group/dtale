import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { default as HeatMapOption, HeatMapOptionProps } from '../../../dtale/menu/HeatMapOption';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, tickUpdate } from '../../test-utils';

describe('HeatMapOption tests', () => {
  let result: ReactWrapper;
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
    store.getState().showAllHeatmapColumns = showAllHeatmapColumns;
    buildInnerHTML({ settings: '' }, store);
    result = mount(
      <Provider store={store}>
        <HeatMapOption {...props} />,
      </Provider>,
      {
        attachTo: document.getElementById('content') ?? undefined,
      },
    );
    await act(async () => await tickUpdate(result));
    result = result.update();
  };

  beforeEach(() => setupOption());

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('renders successfully with defaults', () => {
    expect(result.find('button').map((b) => b.text())).toEqual(['By Col', 'Overall']);
    result.find('button').first().simulate('click');
    expect(toggleBackgroundSpy).toHaveBeenLastCalledWith('heatmap-col');
    result.find('button').last().simulate('click');
    expect(toggleBackgroundSpy).toHaveBeenLastCalledWith('heatmap-all');
  });

  it('handles background updates w/ all columns displayed', () => {
    setupOption({}, true);
    result.find('button').first().simulate('click');
    expect(toggleBackgroundSpy).toHaveBeenLastCalledWith('heatmap-col-all');
    result.find('button').last().simulate('click');
    expect(toggleBackgroundSpy).toHaveBeenLastCalledWith('heatmap-all-all');
  });
});
