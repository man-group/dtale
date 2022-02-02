import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import {
  default as ShowNonNumericHeatmapColumns,
  ShowNonNumericHeatmapColumnsProps,
} from '../../../dtale/menu/ShowNonNumericHeatmapColumns';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML } from '../../test-utils';

describe('ShowNonNumericHeatmapColumns tests', () => {
  let result: ReactWrapper;
  let props: ShowNonNumericHeatmapColumnsProps;
  let store: Store;

  const setupOption = (
    propOverrides?: Partial<ShowNonNumericHeatmapColumnsProps>,
    showAllHeatmapColumns = false,
  ): void => {
    props = {
      toggleBackground: jest.fn(() => () => undefined),
      ...propOverrides,
    };
    store = reduxUtils.createDtaleStore();
    store.getState().showAllHeatmapColumns = showAllHeatmapColumns;
    buildInnerHTML({ settings: '' }, store);
    result = mount(
      <Provider store={store}>
        <ShowNonNumericHeatmapColumns {...props} />,
      </Provider>,
      {
        attachTo: document.getElementById('content') ?? undefined,
      },
    );
  };

  beforeEach(() => setupOption());

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('renders successfully with defaults', () => {
    expect(result.find('i.ico-check-box-outline-blank')).toHaveLength(1);
  });

  it('handles changes to checkbox', () => {
    result.find('i.ico-check-box-outline-blank').simulate('click');
    expect(store.getState().showAllHeatmapColumns).toBe(true);
  });

  it('handles checkbox check w/ background', () => {
    setupOption({ backgroundMode: 'heatmap-col' });
    result.find('i.ico-check-box-outline-blank').simulate('click');
    expect(store.getState().showAllHeatmapColumns).toBe(true);
    expect(props.toggleBackground).toHaveBeenLastCalledWith('heatmap-col-all');
  });

  it('handles checkbox uncheck w/ background', () => {
    setupOption({ backgroundMode: 'heatmap-col-all' }, true);
    result.find('i.ico-check-box').simulate('click');
    expect(store.getState().showAllHeatmapColumns).toBe(false);
    expect(props.toggleBackground).toHaveBeenLastCalledWith('heatmap-col');
  });
});
