import { act, fireEvent, getByText, render, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';

import { DataViewer } from '../../dtale/DataViewer';
import DimensionsHelper from '../DimensionsHelper';
import { clickColMenuButton } from '../iframe/iframe-utils';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, selectOption } from '../test-utils';

describe('NumericFormatting', () => {
  const { open } = window;
  const openFn = jest.fn();
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    delete (window as any).open;
    window.open = openFn;
  });

  beforeEach(async () => {
    (axios.get as any).mockImplementation(async (url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    dimensions.afterAll();
    window.open = open;
  });

  it('applies formatting', async () => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    await act(
      async () =>
        await render(
          <Provider store={store}>
            <DataViewer />
          </Provider>,
          {
            container: document.getElementById('content') ?? undefined,
          },
        ).container,
    );
    await act(async () => {
      await fireEvent.click(screen.queryAllByTestId('header-cell')[1].getElementsByClassName('text-nowrap')[0]);
    });
    await clickColMenuButton('Aggregations');
    const aggregations = screen.getByTestId('column-aggregations');
    expect(getByText(aggregations, 'Total:').parentElement!.textContent).toBe('Total:-149.5377');
    expect(getByText(aggregations, 'Average:').parentElement!.textContent).toBe('Average:-0.0100');
    expect(getByText(aggregations, 'Median:').parentElement!.textContent).toBe('Median:-0.0079');
    await selectOption(aggregations.getElementsByClassName('Select')[1] as HTMLElement, 'col1');
    expect(getByText(aggregations, 'Weighted Avg:').parentElement!.textContent).toBe('Weighted Avg:-1.7146');
  });
});
