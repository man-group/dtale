import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { default as ShowNonNumericHeatmapColumns } from '../../../dtale/menu/ShowNonNumericHeatmapColumns';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, tickUpdate } from '../../test-utils';

describe('ShowNonNumericHeatmapColumns tests', () => {
  let result: ReactWrapper;
  let store: Store;

  const setupOption = async (backgroundMode?: string, showAllHeatmapColumns = false): Promise<void> => {
    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    store.getState().showAllHeatmapColumns = showAllHeatmapColumns;
    store.getState().settings.backgroundMode = backgroundMode;
    result = mount(
      <Provider store={store}>
        <ShowNonNumericHeatmapColumns />,
      </Provider>,
      {
        attachTo: document.getElementById('content') ?? undefined,
      },
    );
    await act(async () => await tickUpdate(result));
    result = result.update();
  };

  beforeEach(async () => await setupOption());

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('renders successfully with defaults', () => {
    expect(result.find('i.ico-check-box-outline-blank')).toHaveLength(1);
  });

  it('handles changes to checkbox', () => {
    result.find('i.ico-check-box-outline-blank').simulate('click');
    expect(store.getState().showAllHeatmapColumns).toBe(true);
  });

  it('handles checkbox check w/ background', async () => {
    await setupOption('heatmap-col');
    result.find('i.ico-check-box-outline-blank').simulate('click');
    expect(store.getState().showAllHeatmapColumns).toBe(true);
    expect(store.getState().settings.backgroundMode).toBe('heatmap-col-all');
  });

  it('handles checkbox uncheck w/ background', async () => {
    await setupOption('heatmap-col-all', true);
    result.find('i.ico-check-box').simulate('click');
    expect(store.getState().showAllHeatmapColumns).toBe(false);
    expect(store.getState().settings.backgroundMode).toBe('heatmap-col');
  });
});
