import { act, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';

import { DataViewer } from '../../dtale/DataViewer';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, mockChartJS } from '../test-utils';

describe('DataViewer tests', () => {
  const { open } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 1205,
    offsetHeight: 775,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    delete (window as any).open;
    window.open = jest.fn();
    mockChartJS();
  });

  beforeEach(() => {
    (axios.get as any).mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
  });

  afterEach(jest.resetAllMocks);

  afterAll(() => {
    dimensions.afterAll();
    window.open = open;
    jest.restoreAllMocks();
  });

  it('DataViewer: cell editing', async () => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    let container: Element;
    await act(async () => {
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
    const lastCell = (): Element => {
      const cells = container!.getElementsByClassName('cell');
      return cells[cells.length - 1];
    };
    await act(async () => {
      fireEvent.click(lastCell());
      fireEvent.click(lastCell());
    });
    await act(async () => {
      fireEvent.keyDown(screen.getByTestId('grid-cell-editor'), { key: 'Escape' });
    });
    await act(async () => {
      fireEvent.click(lastCell());
      fireEvent.click(lastCell());
    });
    await act(async () => {
      fireEvent.change(screen.getByTestId('grid-cell-editor'), { target: { value: '20000101' } });
    });
    await act(async () => {
      fireEvent.keyDown(screen.getByTestId('grid-cell-editor'), { key: 'Enter' });
    });
    expect(lastCell().textContent).toBe('20000101');
  });
});
