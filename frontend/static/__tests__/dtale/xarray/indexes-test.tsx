import { act, fireEvent, render } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { DataViewer } from '../../../dtale/DataViewer';
import DimensionsHelper from '../../DimensionsHelper';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, clickMainMenuButton, mockChartJS, selectOption } from '../../test-utils';

describe('DataViewer tests', () => {
  let store: Store;

  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 775,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();
  });

  beforeEach(async () => {
    (axios.get as any).mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));

    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    await act(() => {
      render(
        <Provider store={store}>
          <DataViewer />
        </Provider>,
        { container: document.getElementById('content') ?? undefined },
      );
    });
    await clickMainMenuButton('Convert To XArray');
  });

  afterEach(jest.restoreAllMocks);

  afterAll(() => dimensions.afterAll());

  it('DataViewer: convert data to xarray dataset', async () => {
    await selectOption(
      document.body
        .getElementsByClassName('modal-body')[0]
        .getElementsByClassName('form-group')[0]
        .getElementsByClassName('Select')[0] as HTMLElement,
      'col1',
    );
    await act(async () => {
      fireEvent.click(document.body.getElementsByClassName('modal-footer')[0].getElementsByTagName('button')[0]);
    });
    expect(store.getState().xarray).toBe(true);
  });
});
