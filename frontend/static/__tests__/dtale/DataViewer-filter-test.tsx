import { act, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { DataViewer } from '../../dtale/DataViewer';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, clickMainMenuButton, mockChartJS } from '../test-utils';

describe('FilterPanel', () => {
  let container: Element;
  let store: Store;
  const { open } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 775,
  });
  const openFn = jest.fn();

  beforeAll(() => {
    dimensions.beforeAll();

    delete (window as any).open;
    window.open = openFn;

    mockChartJS();
  });

  beforeEach(async () => {
    (axios.get as any).mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
  });

  afterEach(jest.resetAllMocks);

  afterAll(() => {
    dimensions.afterAll();
    window.open = open;
    jest.restoreAllMocks();
  });

  const toggleFilterMenu = async (): Promise<void> => {
    await clickMainMenuButton('Custom Filter');
  };

  const buildResult = async (dataId = '1'): Promise<void> => {
    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '', dataId }, store);
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
    await toggleFilterMenu();
  };

  const clickFilterBtn = async (text: string): Promise<void> => {
    await act(async () => {
      const buttons = screen.getByTestId('filter-panel').getElementsByTagName('button');
      fireEvent.click([...buttons].find((b) => b.textContent === text)!);
    });
  };

  it('DataViewer: filtering', async () => {
    await buildResult();
    expect(screen.getByTestId('filter-panel')).toBeDefined();
    await clickFilterBtn('Close');
    expect(screen.queryByTestId('filter-panel')).toBeNull();
    await toggleFilterMenu();
    await clickFilterBtn('Clear');
    expect(screen.queryByTestId('filter-panel')).toBeNull();
    await toggleFilterMenu();
    await clickFilterBtn('numexpr');
    expect(store.getState().queryEngine).toBe('numexpr');
    await act(async () => {
      await fireEvent.click(screen.getByText('Highlight Filtered Rows').parentElement?.getElementsByTagName('i')[0]!);
    });
    expect(store.getState().settings.highlightFilter).toBe(true);
    await act(async () => {
      const textarea = screen.getByTestId('filter-panel').getElementsByTagName('textarea')[0];
      fireEvent.change(textarea, { target: { value: 'test' } });
    });
    await clickFilterBtn('Apply');
    expect(container.getElementsByClassName('data-viewer-info')[0].textContent).toBe('Filter:test');
    await act(async () => {
      const cancelIcons = container.getElementsByClassName('data-viewer-info')[0].getElementsByClassName('ico-cancel');
      fireEvent.click(cancelIcons[cancelIcons.length - 1]);
    });
    expect(
      container.getElementsByClassName('data-viewer-info')[0].querySelectorAll('div.data-viewer-info.is-expanded')
        .length,
    ).toBe(0);
  });

  it('DataViewer: filtering with errors & documentation', async () => {
    await buildResult();
    await act(async () => {
      const textarea = screen.getByTestId('filter-panel').getElementsByTagName('textarea')[0];
      fireEvent.change(textarea, { target: { value: 'error' } });
    });
    await clickFilterBtn('Apply');
    expect(container.getElementsByClassName('dtale-alert')[0].textContent).toBe('No data found');
    await act(async () => {
      const filterPanel = screen.getByTestId('filter-panel');
      const error = filterPanel.getElementsByClassName('dtale-alert')[0];
      fireEvent.click(error.getElementsByClassName('ico-cancel')[0]);
    });
    expect(screen.getByTestId('filter-panel').getElementsByClassName('dtale-alert').length).toBe(0);
    await clickFilterBtn('Help');
    const pandasURL = 'https://pandas.pydata.org/pandas-docs/stable/user_guide/indexing.html#indexing-query';
    expect(openFn.mock.calls[openFn.mock.calls.length - 1][0]).toBe(pandasURL);
  });

  it('DataViewer: filtering, context variables error', async () => {
    await buildResult('error');
    expect(screen.getByTestId('filter-panel').getElementsByClassName('dtale-alert')[0].textContent).toBe(
      'Error loading context variables',
    );
  });

  it('DataViewer: column filters', async () => {
    await buildResult();
    expect(screen.getByTestId('structured-filters').textContent).toBe('Active Column Filters:foo == 1 and');
    await act(async () => {
      fireEvent.click(screen.getByTestId('structured-filters').getElementsByClassName('ico-cancel')[0]);
    });
    expect(screen.queryByTestId('structured-filters')).toBeNull();
  });
});
