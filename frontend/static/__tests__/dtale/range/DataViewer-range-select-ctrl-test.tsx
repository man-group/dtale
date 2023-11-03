import { act, fireEvent, render } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';

import { DataViewer } from '../../../dtale/DataViewer';
import DimensionsHelper from '../../DimensionsHelper';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, mockChartJS } from '../../test-utils';

describe('DataViewer tests', () => {
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 775,
  });

  const execCommandMock = jest.fn();

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();
    Object.defineProperty(global.document, 'execCommand', { value: execCommandMock });
  });

  afterAll(() => {
    dimensions.afterAll();
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    execCommandMock.mockReset();
    (axios.get as any).mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
  });

  it('DataViewer: row ctrl selection', async () => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    const result = await act(() => {
      const { container } = render(
        <Provider store={store}>
          <DataViewer />
        </Provider>,
        {
          container: document.getElementById('content') as HTMLElement,
        },
      );
      return container;
    });
    await act(async () => {
      fireEvent.click(result.getElementsByClassName('cell')[0], { ctrlKey: true });
    });
    expect(store.getState().ctrlRows).toEqual([1]);
    await act(async () => {
      fireEvent.click(result.getElementsByClassName('cell')[1], { ctrlKey: true });
    });
    expect(store.getState().ctrlRows).toEqual([1, 2]);
    await act(async () => {
      fireEvent.click(result.getElementsByClassName('cell')[0], { ctrlKey: true });
    });
    expect(store.getState().ctrlRows).toEqual([2]);
  });
});
