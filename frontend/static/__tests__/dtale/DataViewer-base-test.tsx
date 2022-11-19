import { act, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';

import { DataViewer } from '../../dtale/DataViewer';
import DimensionsHelper from '../DimensionsHelper';
import { validateHeaders } from '../iframe/iframe-utils';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, clickMainMenuButton, mockChartJS, PREDEFINED_FILTERS } from '../test-utils';

describe('DataViewer tests', () => {
  const { location } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();

    delete (window as any).location;
    (window as any).location = { pathname: '' };
  });

  beforeEach(() => {
    (axios.get as any).mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
  });

  afterEach(jest.resetAllMocks);

  afterAll(() => {
    dimensions.afterAll();
    window.location = location;
    jest.restoreAllMocks();
  });

  it('DataViewer: base operations (column selection, locking, sorting, moving to front, col-analysis,...', async () => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '', predefinedFilters: PREDEFINED_FILTERS }, store);
    const container = await act(
      async () =>
        render(
          <Provider store={store}>
            <DataViewer />
          </Provider>,
          {
            container: document.getElementById('content') ?? undefined,
          },
        ).container,
    );
    validateHeaders(['col1', 'col2', 'col3', 'col4']);
    await act(async () => {
      fireEvent.click(container.getElementsByClassName('crossed')[0].getElementsByClassName('grid-menu')[0]);
    });
    expect(
      [...screen.getByTestId('data-viewer-menu').querySelectorAll('ul li span.font-weight-bold')].map(
        (s) => s.textContent,
      ),
    ).toEqual([
      ...['Convert To XArray', 'Describe', 'Custom Filter', 'Predefined Filters', 'show_hide', 'Dataframe Functions'],
      ...['Clean Column', 'Merge & Stack', 'Summarize Data', 'Time Series Analysis', 'Duplicates', 'Missing Analysis'],
      ...['Feature Analysis', 'Correlations', 'Predictive Power Score', 'Charts', 'Network Viewer', 'Heat Map'],
      ...['Highlight Dtypes', 'Highlight Missing', 'Highlight Outliers', 'Highlight Range', 'Low Variance Flag'],
      ...['gage_rnr', 'Instances 1', 'Code Export', 'Export', 'Load Data', 'Refresh Widths', 'About', 'Theme'],
      ...['Reload Data', 'Pin menu', 'Language', 'Shutdown'],
    ]);
    await clickMainMenuButton('Refresh Widths');
    await clickMainMenuButton('Shutdown');
    expect(window.location.pathname).not.toBeNull();
  });
});
