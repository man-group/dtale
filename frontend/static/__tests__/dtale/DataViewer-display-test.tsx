import { act, fireEvent, render } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { DataViewer } from '../../dtale/DataViewer';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, findMainMenuButton, mockChartJS } from '../test-utils';

describe('DataViewer tests', () => {
  let container: Element;
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
    (axios.get as any).mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));

    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '', theme: 'dark' }, store);
    await act(() => {
      const result = render(
        <Provider store={store}>
          <DataViewer />
        </Provider>,
        {
          container: document.getElementById('content') ?? undefined,
        },
      );
      container = result.container;
    });
  });

  afterEach(jest.resetAllMocks);

  afterAll(() => {
    dimensions.afterAll();
    jest.restoreAllMocks();
  });

  it('DataViewer: loads dark mode correct on inital render', async () => {
    expect(store.getState().theme).toBe('dark');
    expect(container.getElementsByClassName('BottomLeftGrid_ScrollWrapper')[0]).toHaveStyle({
      backgroundColor: 'inherit',
    });
  });

  it('DataViewer: toggle dark mode', async () => {
    await act(async () => fireEvent.click(findMainMenuButton('Light')!));
    expect(store.getState().theme).toBe('light');
    expect(container.getElementsByClassName('BottomLeftGrid_ScrollWrapper')[0]).toHaveStyle({
      backgroundColor: '#f7f7f7',
    });
  });
});
