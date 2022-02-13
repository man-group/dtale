import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { DataViewer } from '../../dtale/DataViewer';
import { ColumnDef } from '../../dtale/DataViewerState';
import Formatting from '../../popups/formats/Formatting';
import { ActionType } from '../../redux/actions/AppActions';
import { DataViewerUpdateType } from '../../redux/state/AppState';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, mockChartJS, tickUpdate } from '../test-utils';

describe('DataViewer tests', () => {
  let result: ReactWrapper;
  let store: Store;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();
  });

  beforeEach(async () => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => {
      if (url === '/dtale/data/1?ids=%5B%22100-101%22%5D') {
        return Promise.resolve({ data: { error: 'No data found' } });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      {
        attachTo: document.getElementById('content') ?? undefined,
      },
    );

    await act(async () => await tickUpdate(result));
    result = result.update();
  });

  afterAll(() => dimensions.afterAll());

  it('DataViewer: handles an update to columnsToToggle', async () => {
    store.dispatch({
      type: ActionType.DATA_VIEWER_UPDATE,
      update: { type: DataViewerUpdateType.TOGGLE_COLUMNS, columns: { col1: false } },
    });
    result = result.update();
    await act(async () => await tickUpdate(result));
    result = result.update();
    expect(
      result
        .find(Formatting)
        .props()
        .columns.find((c: ColumnDef) => c.name === 'col1').visible,
    ).toBe(false);
  });
});
