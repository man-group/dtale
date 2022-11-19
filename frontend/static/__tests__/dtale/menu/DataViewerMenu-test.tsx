import { act, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import { default as DataViewerMenu, DataViewerMenuProps } from '../../../dtale/menu/DataViewerMenu';
import * as serverState from '../../../dtale/serverStateManagement';
import { PopupType } from '../../../redux/state/AppState';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, PREDEFINED_FILTERS } from '../../test-utils';

describe('DataViewerMenu tests', () => {
  const { open } = window;
  let store: Store;
  let updateLanguageSpy: jest.SpyInstance;
  const openSpy = jest.fn();

  beforeAll(() => {
    delete (window as any).open;
    window.open = openSpy;
  });

  beforeEach(() => {
    updateLanguageSpy = jest.spyOn(serverState, 'updateLanguage');
    updateLanguageSpy.mockResolvedValue(Promise.resolve({ success: true }));
    store = reduxUtils.createDtaleStore();
  });

  afterEach(() => {
    openSpy.mockReset();
  });

  afterAll(() => {
    window.open = open;
    jest.restoreAllMocks();
  });

  const buildMenu = (hiddenProps?: Record<string, string>, props?: Partial<DataViewerMenuProps>): Element => {
    buildInnerHTML({ settings: '', ...hiddenProps }, store);
    const finalProps = {
      openChart: () => ({}),
      propagateState: () => ({}),
      menuOpen: true,
      selectedCols: [],
      sortInfo: [],
      columns: [],
      iframe: false,
      dataId: '1',
      settings: {},
      rows: 50,
      ...props,
    };
    return render(
      <Provider store={store}>
        <DataViewerMenu {...finalProps} />
      </Provider>,
      {
        container: document.getElementById('content') ?? undefined,
      },
    ).container;
  };

  it('DataViewerMenu: render', () => {
    const result = buildMenu();
    const togglers = [...result.querySelectorAll('ul li span.toggler-action')];
    expect(togglers[togglers.length - 1].textContent).toBe('Shutdown');
  });

  it('DataViewerMenu: hide_shutdown == True', () => {
    const result = buildMenu({ hideShutdown: 'True' });
    const togglers = [...result.querySelectorAll('ul li span.toggler-action')];
    expect(togglers.find((t) => t.textContent?.includes('Instances'))?.textContent).toBe('Instances 1');
  });

  it('DataViewerMenu: processes == 2', () => {
    const result = buildMenu({ hideShutdown: 'True', processes: '2' });
    const togglers = [...result.querySelectorAll('ul li span.toggler-action')];
    expect(togglers.find((t) => t.textContent?.includes('Instances'))?.textContent).toBe('Instances 2');
  });

  it('opens side panel', async () => {
    buildMenu({ predefinedFilters: PREDEFINED_FILTERS });
    await act(async () => {
      fireEvent.click(screen.getByText('Missing Analysis'));
    });
    expect(store.getState().sidePanel.view).toBe('missingno');
    await act(async () => {
      fireEvent.click(screen.getByText('gage_rnr'));
    });
    expect(store.getState().sidePanel.view).toBe('gage_rnr');
    await act(async () => {
      fireEvent.click(screen.getByText('Correlations'));
    });
    expect(store.getState().sidePanel.view).toBe('correlations');
    await act(async () => {
      fireEvent.click(screen.getByText('Predictive Power Score'));
    });
    expect(store.getState().sidePanel.view).toBe('pps');
    await act(async () => {
      fireEvent.click(screen.getByText('show_hide'));
    });
    expect(store.getState().sidePanel.view).toBe('show_hide');
    await act(async () => {
      fireEvent.click(screen.getByText('Predefined Filters'));
    });
    expect(store.getState().sidePanel.view).toBe('predefined_filters');
    await act(async () => {
      fireEvent.click(screen.getByText('Time Series Analysis'));
    });
    expect(store.getState().sidePanel.view).toBe('timeseries_analysis');
  });

  it('calls window.open', async () => {
    buildMenu();
    await act(async () => {
      fireEvent.click(screen.getByText('Merge & Stack'));
    });
    expect(window.open).toHaveBeenCalledWith('/dtale/popup/merge', '_blank');
  });

  it('updates languages', async () => {
    buildMenu();
    await act(async () => {
      const languages = [...screen.getByTestId('language-options').getElementsByTagName('button')];
      fireEvent.click(languages[languages.length - 1]);
    });
    expect(updateLanguageSpy.mock.calls[0][0]).toBe('cn');
    expect(store.getState().language).toBe('cn');
  });

  it('opens export', async () => {
    buildMenu();
    await act(async () => {
      fireEvent.click(screen.getByText('Export'));
    });
    expect(store.getState().chartData).toEqual({ visible: true, type: PopupType.EXPORT, rows: 50, size: 'sm' });
  });

  describe('iframe handling', () => {
    const { self, top } = window;
    const resourceBaseUrl = (window as any).resourceBaseUrl;

    beforeAll(() => {
      delete (window as any).top;
      delete (window as any).self;
      delete (window as any).resourceBaseUrl;
      (window as any).top = { location: { href: 'http://test.com' } };
      (window as any).self = { location: { href: 'http://test/dtale/iframe' } };
    });

    beforeEach(() => {
      buildMenu({ iframe: 'True' });
    });

    afterAll(() => {
      window.top = top;
      window.self = self;
      (window as any).resourceBaseUrl = resourceBaseUrl;
    });

    it('correctly opens new windows', async () => {
      (window as any).resourceBaseUrl = '/test-route/';
      await act(async () => {
        fireEvent.click(screen.getByText('Describe'));
      });
      expect(openSpy).toHaveBeenLastCalledWith('/test-route/dtale/popup/describe/1', '_blank');
      await act(async () => {
        fireEvent.click(screen.getByText('Charts'));
      });
      expect(openSpy).toHaveBeenLastCalledWith('/test-route/dtale/charts/1', '_blank');
      await act(async () => {
        fireEvent.click(screen.getByText('Instances'));
      });
      expect(openSpy).toHaveBeenLastCalledWith(
        '/test-route/dtale/popup/instances/1',
        '_blank',
        'titlebar=1,location=1,status=1,width=750,height=450',
      );
    });
  });
});
