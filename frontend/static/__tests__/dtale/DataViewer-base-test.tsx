import axios from 'axios';
import { mount } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';

import ColumnMenu from '../../dtale/column/ColumnMenu';
import { DataViewer } from '../../dtale/DataViewer';
import DataViewerMenu from '../../dtale/menu/DataViewerMenu';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, clickMainMenuButton, mockChartJS, PREDEFINED_FILTERS, tickUpdate } from '../test-utils';

const COL_PROPS = reduxUtils.DATA.columns.map((c, i) => {
  const width = i === 0 ? 70 : 20;
  return {
    ...c,
    width,
    headerWidth: i === 0 ? 70 : 20,
    dataWidth: width,
    locked: i === 0,
  };
});

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
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
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
    let result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      {
        attachTo: document.getElementById('content') ?? undefined,
      },
    );
    await act(async () => await tickUpdate(result));
    result = result.update();
    expect(result.find('.main-grid div.headerCell').map((hc) => hc.find('.text-nowrap').text())).toEqual([
      'col1',
      'col2',
      'col3',
      'col4',
    ]);
    expect(result.find(ColumnMenu).props().columns).toEqual(COL_PROPS);
    await act(async () => {
      result.find('div.crossed').first().find('div.grid-menu').first().simulate('click');
    });
    result = result.update();
    expect(
      result
        .find(DataViewerMenu)
        .find('ul li span.font-weight-bold')
        .map((s) => s.text()),
    ).toEqual([
      ...['Convert To XArray', 'Describe', 'Custom Filter', 'Predefined Filters', 'show_hide', 'Dataframe Functions'],
      ...['Clean Column', 'Merge & Stack', 'Summarize Data', 'Time Series Analysis', 'Duplicates', 'Missing Analysis'],
      ...['Feature Analysis', 'Correlations', 'Predictive Power Score', 'Charts', 'Network Viewer', 'Heat Map'],
      ...['Highlight Dtypes', 'Highlight Missing', 'Highlight Outliers', 'Highlight Range', 'Low Variance Flag'],
      ...['gage_rnr', 'Instances 1', 'Code Export', 'Export', 'Load Data', 'Refresh Widths', 'About', 'Theme'],
      ...['Reload Data', 'Pin menu', 'Language', 'Shutdown'],
    ]);
    result = await clickMainMenuButton(result, 'Refresh Widths');
    result = await clickMainMenuButton(result, 'Shutdown');
    expect(window.location.pathname).not.toBeNull();
  });
});
