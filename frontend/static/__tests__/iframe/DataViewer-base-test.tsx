import { act, fireEvent, getByTestId, render, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { DataViewer } from '../../dtale/DataViewer';
import { ActionType } from '../../redux/actions/AppActions';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, clickMainMenuButton } from '../test-utils';

import { clickColMenuButton, clickColMenuSubButton, openColMenu, validateHeaders } from './iframe-utils';

describe('DataViewer iframe tests', () => {
  const { location, open, top, self } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 500,
    innerHeight: 500,
  });
  let result: Element;
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
    jest.mock('@blueprintjs/datetime2', () => {
      const { createMockComponent } = require('../mocks/createMockComponent');
      return { DateInput2: createMockComponent('DateInput2') };
    });
  });

  beforeEach(async () => {
    (axios.get as any).mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '', iframe: 'True', xarray: 'True' }, store);
    result = await act(
      () =>
        render(
          <Provider store={store}>
            <DataViewer />
          </Provider>,
          {
            container: document.getElementById('content') ?? undefined,
          },
        ).container,
    );
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

  const colMenu = (): Element => document.getElementById('column-menu-div')!;

  it('main menu option display', async () => {
    validateHeaders(['col1', 'col2', 'col3', 'col4']);
    await act(async () => {
      await fireEvent.click(result.querySelector('div.crossed')!.querySelector('div.grid-menu')!);
    });
    expect(
      [...screen.getByTestId('data-viewer-menu').querySelectorAll('ul li span.font-weight-bold')].map(
        (s) => s.textContent,
      ),
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
    await openColMenu(3);
    expect(document.getElementById('column-menu-div')).toBeDefined();
    await act(async () => {
      await store.dispatch({ type: ActionType.HIDE_COLUMN_MENU, colName: 'col4' });
    });
    expect(document.getElementById('column-menu-div')).toBeNull();
    await openColMenu(3);
    expect(colMenu().getElementsByTagName('header')[0].textContent).toBe('Column "col4"Data Type:datetime64[ns]');
    expect(Array.from(colMenu().querySelectorAll('ul li span.font-weight-bold')).map((s) => s.textContent)).toEqual([
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
    await openColMenu(3);
    await clickColMenuSubButton('Asc');
    expect(result.querySelector('div.row div.col')!.textContent).toBe('Sort:col4 (ASC)');
    await openColMenu(2);
    expect(colMenu().getElementsByTagName('header')[0].textContent).toBe('Column "col3"Data Type:object');
    await act(async () => {
      await store.dispatch({ type: ActionType.HIDE_COLUMN_MENU, colName: 'col3' });
    });
    await openColMenu(3);
    await clickColMenuSubButton('fa-step-backward', 1);
    validateHeaders(['▲col4', 'col1', 'col2', 'col3']);
    await openColMenu(3);
    await clickColMenuSubButton('fa-caret-left', 1);
    validateHeaders(['▲col4', 'col1', 'col3', 'col2']);
    await openColMenu(2);
    await clickColMenuSubButton('fa-caret-right', 1);
    validateHeaders(['▲col4', 'col1', 'col2', 'col3']);
    await openColMenu(0);
    // lock
    await clickColMenuButton('Lock');
    validateHeaders(
      ['col1', 'col2', 'col3'],
      Array.from(result.querySelector('div.TopRightGrid_ScrollWrapper')!.getElementsByClassName('headerCell')),
    );
    // unlock
    await openColMenu(0);
    await clickColMenuButton('Unlock');
    validateHeaders(['▲col4', 'col1', 'col2', 'col3']);
    // clear sorts
    await act(async () => {
      await fireEvent.click(
        result.getElementsByClassName('data-viewer-info')[0].getElementsByClassName('ico-cancel')[0],
      );
    });
    expect(result.querySelectorAll('div.data-viewer-info.is-expanded').length).toBe(0);
    await openColMenu(0);
    await openColMenu(3);
    await openColMenu(2);
  });

  it('handles main menu functions', async () => {
    await openColMenu(2);
    await clickColMenuButton('Describe(Column Analysis)');
    expect(openSpy.mock.calls[0][0]).toBe('/dtale/popup/describe/1?selectedCol=col3');
    await clickMainMenuButton('Describe');
    expect(openSpy.mock.calls[openSpy.mock.calls.length - 1][0]).toBe('/dtale/popup/describe/1');
    await clickMainMenuButton('Correlations');
    expect(store.getState().sidePanel).toEqual({
      visible: true,
      view: 'correlations',
    });
    await clickMainMenuButton('Charts');
    expect(openSpy.mock.calls[openSpy.mock.calls.length - 1][0]).toBe('/dtale/charts/1');
    await clickMainMenuButton('Network Viewer');
    expect(openSpy.mock.calls[openSpy.mock.calls.length - 1][0]).toBe('/dtale/network/1');
    await clickMainMenuButton('Instances 1');
    expect(openSpy.mock.calls[openSpy.mock.calls.length - 1][0]).toBe('/dtale/popup/instances/1');
    await clickMainMenuButton('Refresh Widths');
    await clickMainMenuButton('Reload Data');
    expect(window.location.reload).toHaveBeenCalled();
    await clickMainMenuButton('Shutdown');
    expect(window.location.pathname).not.toBeNull();
    await openColMenu(2);
    await clickColMenuButton('Formats');
    expect(getByTestId(document.body, 'formatting-body')).toBeDefined();
  });

  it('opens in a new tab', async () => {
    (window as any).location = { reload: jest.fn(), pathname: '/dtale/iframe/1' };
    await clickMainMenuButton('Open In New Tab');
    expect(openSpy.mock.calls[openSpy.mock.calls.length - 1][0]).toBe('/dtale/main/1');
  });
});
