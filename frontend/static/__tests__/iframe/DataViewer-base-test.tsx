import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { Provider } from 'react-redux';
import MultiGrid from 'react-virtualized/dist/commonjs/MultiGrid';
import { Store } from 'redux';

import ColumnMenu from '../../dtale/column/ColumnMenu';
import { DataViewer } from '../../dtale/DataViewer';
import { ReactHeader as Header } from '../../dtale/Header';
import DataViewerInfo from '../../dtale/info/DataViewerInfo';
import { DataViewerMenu } from '../../dtale/menu/DataViewerMenu';
import Formatting from '../../popups/formats/Formatting';
import DimensionsHelper from '../DimensionsHelper';
import { createMockComponent } from '../mocks/createMockComponent';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, clickMainMenuButton, findMainMenuButton, tickUpdate } from '../test-utils';

import { clickColMenuButton, clickColMenuSubButton, openColMenu, validateHeaders } from './iframe-utils';

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

describe('DataViewer iframe tests', () => {
  const { location, open, top, self } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 500,
    innerHeight: 500,
  });
  let result: ReactWrapper;
  let store: Store;
  const openSpy = jest.fn();

  beforeAll(() => {
    dimensions.beforeAll();
    delete (window as any).location;
    delete (window as any).open;
    delete (window as any).top;
    delete (window as any).self;
    (window as any).location = { reload: jest.fn(), pathname: '' };
    window.open = openSpy;
    (window as any).top = { location: { href: 'http://test.com' } };
    (window as any).self = { location: { href: 'http://test/dtale/iframe' } };
    jest.mock('@blueprintjs/datetime', () => ({ DateInput: createMockComponent('DateInput') }));
  });

  beforeEach(async () => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '', iframe: 'True', xarray: 'True' }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      {
        attachTo: document.getElementById('content') ?? undefined,
      },
    );
    await tickUpdate(result);
  });

  afterEach(jest.resetAllMocks);

  afterAll(() => {
    dimensions.afterAll();
    window.location = location;
    window.open = open;
    window.top = top;
    window.self = self;
    jest.restoreAllMocks();
  });

  const colMenu = (): ReactWrapper => result.find(ColumnMenu).first();

  it('main menu option display', async () => {
    const grid = result.find(MultiGrid).first().instance();
    validateHeaders(result, ['col1', 'col2', 'col3', 'col4']);
    expect(grid.props.columns).toEqual(COL_PROPS);
    result.find('div.crossed').first().find('div.grid-menu').first().simulate('click');
    expect(
      result
        .find(DataViewerMenu)
        .find('ul li span.font-weight-bold')
        .map((s) => s.text()),
    ).toEqual([
      ...['Open In New Tab', 'XArray Dimensions', 'Describe', 'Custom Filter', 'show_hide', 'Dataframe Functions'],
      ...['Clean Column', 'Merge & Stack', 'Summarize Data', 'Time Series Analysis', 'Duplicates', 'Missing Analysis'],
      ...['Feature Analysis', 'Correlations', 'Predictive Power Score', 'Charts', 'Network Viewer', 'Heat Map'],
      ...['Highlight Dtypes', 'Highlight Missing', 'Highlight Outliers', 'Highlight Range', 'Low Variance Flag'],
      ...['gage_rnr', 'Instances 1', 'Code Export', 'Export', 'Load Data', 'Refresh Widths', 'About', 'Theme'],
      ...['Reload Data', 'Pin menu', 'Language', 'Shutdown'],
    ]);
  });

  it('DataViewer: validate column menu options', async () => {
    result = await openColMenu(result, 3);
    expect(result.find('#column-menu-div').length).toBe(1);
    result.find(Header).last().instance().props.hideColumnMenu('col4');
    result.update();
    expect(result.find('#column-menu-div').length).toBe(0);
    result = await openColMenu(result, 3);
    expect(colMenu().find('header').first().text()).toBe('Column "col4"Data Type:datetime64[ns]');
    expect(
      colMenu()
        .find('ul li span.font-weight-bold')
        .map((s) => s.text()),
    ).toEqual([
      'Lock',
      'Hide',
      'Delete',
      'Rename',
      'Replacements',
      'Type Conversion',
      'Duplicates',
      'Describe(Column Analysis)',
      'Formats',
    ]);
  });

  it('handles base operations (column selection, locking, sorting, moving to front, col-analysis,...', async () => {
    result = await openColMenu(result, 3);
    result = await clickColMenuSubButton(result, 'Asc');
    expect(result.find('div.row div.col').first().text()).toBe('Sort:col4 (ASC)');
    result = await openColMenu(result, 2);
    expect(colMenu().find('header').first().text()).toBe('Column "col3"Data Type:object');
    result.find(Header).at(2).instance().props.hideColumnMenu('col3');
    result = await openColMenu(result, 3);
    result = await clickColMenuSubButton(result, 'fa-step-backward', 1);
    validateHeaders(result, ['▲col4', 'col1', 'col2', 'col3']);
    result = await openColMenu(result, 3);
    result = await clickColMenuSubButton(result, 'fa-caret-left', 1);
    validateHeaders(result, ['▲col4', 'col1', 'col3', 'col2']);
    result = await openColMenu(result, 2);
    result = await clickColMenuSubButton(result, 'fa-caret-right', 1);
    validateHeaders(result, ['▲col4', 'col1', 'col2', 'col3']);
    result = await openColMenu(result, 0);
    // lock
    result = await clickColMenuButton(result, 'Lock');
    expect(
      result
        .find('div.TopRightGrid_ScrollWrapper')
        .first()
        .find('div.headerCell')
        .map((hc) => hc.find('.text-nowrap').text()),
    ).toEqual(['col1', 'col2', 'col3']);
    // unlock
    result = await openColMenu(result, 0);
    result = await clickColMenuButton(result, 'Unlock');
    expect(
      result
        .find('div.TopRightGrid_ScrollWrapper')
        .first()
        .find('div.headerCell')
        .map((hc) => hc.find('.text-nowrap').text()),
    ).toEqual(['▲col4', 'col1', 'col2', 'col3']);
    // clear sorts
    result.find(DataViewerInfo).find('i.ico-cancel').first().simulate('click');
    await tickUpdate(result);
    expect(result.find(DataViewerInfo).find('div.data-viewer-info.is-expanded').length).toBe(0);
    result = await openColMenu(result, 0);
    result = await openColMenu(result, 3);
    result = await openColMenu(result, 2);
  });

  it('handles main menu functions', async () => {
    result = await openColMenu(result, 2);
    result = await clickColMenuButton(result, 'Describe(Column Analysis)');
    expect(openSpy.mock.calls[0][0]).toBe('/dtale/popup/describe/1?selectedCol=col3');
    await clickMainMenuButton(result, 'Describe');
    expect(openSpy.mock.calls[openSpy.mock.calls.length - 1][0]).toBe('/dtale/popup/describe/1');
    await clickMainMenuButton(result, 'Correlations');
    expect(store.getState().sidePanel).toEqual({
      visible: true,
      view: 'correlations',
    });
    await clickMainMenuButton(result, 'Charts');
    expect(openSpy.mock.calls[openSpy.mock.calls.length - 1][0]).toBe('/dtale/charts/1');
    await clickMainMenuButton(result, 'Network Viewer');
    expect(openSpy.mock.calls[openSpy.mock.calls.length - 1][0]).toBe('/dtale/network/1');
    await clickMainMenuButton(result, 'Instances 1');
    expect(openSpy.mock.calls[openSpy.mock.calls.length - 1][0]).toBe('/dtale/popup/instances/1');
    const exports = findMainMenuButton(result, 'CSV', 'div.btn-group');
    exports.find('button').first().simulate('click');
    let exportURL = openSpy.mock.calls[openSpy.mock.calls.length - 1][0];
    expect(exportURL.startsWith('/dtale/data-export/1') && exportURL.includes('type=csv')).toBe(true);
    exports.find('button').at(1).simulate('click');
    exportURL = openSpy.mock.calls[openSpy.mock.calls.length - 1][0];
    expect(exportURL.startsWith('/dtale/data-export/1') && exportURL.includes('type=tsv')).toBe(true);
    await clickMainMenuButton(result, 'Refresh Widths');
    await clickMainMenuButton(result, 'Reload Data');
    expect(window.location.reload).toHaveBeenCalled();
    await clickMainMenuButton(result, 'Shutdown');
    expect(window.location.pathname).not.toBeNull();
    result = await clickColMenuButton(result, 'Formats');
    expect(result.find(Formatting).length).toBe(1);
  });

  it('opens in a new tab', async () => {
    (window as any).location = { reload: jest.fn(), pathname: '/dtale/iframe/1' };
    await clickMainMenuButton(result, 'Open In New Tab');
    expect(openSpy.mock.calls[openSpy.mock.calls.length - 1][0]).toBe('/dtale/main/1');
  });
});
