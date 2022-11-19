import { act, fireEvent, render } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';

import { DataViewer } from '../../dtale/DataViewer';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, clickMainMenuButton } from '../test-utils';

describe('DataViewer tests', () => {
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    dimensions.beforeAll();
  });

  beforeEach(() => {
    (axios.get as any).mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
  });

  afterEach(jest.resetAllMocks);

  afterAll(() => {
    dimensions.afterAll();
    jest.restoreAllMocks();
  });

  it('DataViewer: instances', async () => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '', hideShutdown: 'True', processes: '2' }, store);
    await act(() => {
      render(
        <Provider store={store}>
          <DataViewer />
        </Provider>,
        { container: document.getElementById('content') ?? undefined },
      );
    });
    await clickMainMenuButton('Instances');
    expect(document.body.getElementsByClassName('instances-sizer').length).toBe(1);
    const modal = document.body.getElementsByClassName('modal')[0];
    fireEvent.click(modal.getElementsByClassName('ico-close')[0]);
    expect(document.body.getElementsByClassName('instances-sizer').length).toBe(0);
  });
});
