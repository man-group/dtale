import { act, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { DataViewer } from '../../dtale/DataViewer';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, mockChartJS } from '../test-utils';

describe('DataViewer tests', () => {
  let container: Element;
  let store: Store;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    window.innerWidth = 1;
    dimensions.beforeAll();
    mockChartJS();
  });

  beforeEach(async () => {
    (axios.get as any).mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));

    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
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

  it("DataViewer: loads expander column when there isn't enough width", async () => {
    const leftGrid = container.getElementsByClassName('BottomLeftGrid_ScrollWrapper')[0];
    const lockedContents = Array.from(leftGrid.getElementsByClassName('cell')).map((h) => h.textContent);
    expect(lockedContents).toStrictEqual(['0', '▶', '1', '▶', '2', '▶', '3', '▶', '4', '▶']);
  });

  it('DataViewer: shows row details on expander click', async () => {
    const leftGrid = container.getElementsByClassName('BottomLeftGrid_ScrollWrapper')[0];
    await act(async () => fireEvent.click(leftGrid.getElementsByClassName('cell')[1]));
    const viewRowCells = Array.from(screen.getByTestId('view-row-body').getElementsByClassName('view-row-cell'));
    expect(viewRowCells.map((c) => c.textContent)).toStrictEqual([
      'col1:1',
      'col2:2.50',
      'col3:foo',
      'col4:2000-01-01',
    ]);
  });
});
