import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import ChartsOption from '../../../dtale/menu/ChartsOption';
import CorrelationsOption from '../../../dtale/menu/CorrelationsOption';
import { default as DataViewerMenu, DataViewerMenuProps } from '../../../dtale/menu/DataViewerMenu';
import DescribeOption from '../../../dtale/menu/DescribeOption';
import GageRnROption from '../../../dtale/menu/GageRnROption';
import InstancesOption from '../../../dtale/menu/InstancesOption';
import LanguageOption from '../../../dtale/menu/LanguageOption';
import MergeOption from '../../../dtale/menu/MergeOption';
import MissingOption from '../../../dtale/menu/MissingOption';
import PPSOption from '../../../dtale/menu/PPSOption';
import PredefinedFiltersOption from '../../../dtale/menu/PredefinedFiltersOption';
import ShowHideColumnsOption from '../../../dtale/menu/ShowHideColumnsOption';
import TimeseriesAnalysisOption from '../../../dtale/menu/TimeseriesAnalysisOption';
import * as serverState from '../../../dtale/serverStateManagement';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, PREDEFINED_FILTERS, tickUpdate } from '../../test-utils';

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

  const buildMenu = (hiddenProps?: Record<string, string>, props?: Partial<DataViewerMenuProps>): ReactWrapper => {
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
      ...props,
    };
    return mount(
      <Provider store={store}>
        <DataViewerMenu {...finalProps} />
      </Provider>,
      {
        attachTo: document.getElementById('content') ?? undefined,
      },
    );
  };

  it('DataViewerMenu: render', () => {
    const result = buildMenu();
    expect(result.find('ul li span.toggler-action').last().text()).toBe('Shutdown');
  });

  it('DataViewerMenu: hide_shutdown == True', () => {
    const result = buildMenu({ hideShutdown: 'True' });
    expect(
      result
        .find('ul li span.toggler-action')
        .findWhere((b) => b.text().includes('Instances'))
        .first()
        .text(),
    ).toBe('Instances 1');
  });

  it('DataViewerMenu: processes == 2', () => {
    const result = buildMenu({ hideShutdown: 'True', processes: '2' });
    expect(
      result
        .find('ul li span.toggler-action')
        .findWhere((b) => b.text().includes('Instances'))
        .first()
        .text(),
    ).toBe('Instances 2');
  });

  it('opens side panel', () => {
    const result = buildMenu({ predefinedFilters: PREDEFINED_FILTERS });
    result.find(MissingOption).props().open();
    expect(store.getState().sidePanel.view).toBe('missingno');
    result.find(GageRnROption).props().open();
    expect(store.getState().sidePanel.view).toBe('gage_rnr');
    result.find(CorrelationsOption).props().open();
    expect(store.getState().sidePanel.view).toBe('correlations');
    result.find(PPSOption).props().open();
    expect(store.getState().sidePanel.view).toBe('pps');
    result.find(ShowHideColumnsOption).props().open();
    expect(store.getState().sidePanel.view).toBe('show_hide');
    result.find(PredefinedFiltersOption).props().open();
    expect(store.getState().sidePanel.view).toBe('predefined_filters');
    result.find(TimeseriesAnalysisOption).props().open();
    expect(store.getState().sidePanel.view).toBe('timeseries_analysis');
  });

  it('calls window.open', () => {
    const result = buildMenu();
    result.find(MergeOption).props().open();
    expect(window.open).toHaveBeenCalledWith('/dtale/popup/merge', '_blank');
  });

  it('updates languages', async () => {
    const result = buildMenu();
    await result.find(LanguageOption).find('button').last().simulate('click');
    await tickUpdate(result);
    expect(updateLanguageSpy.mock.calls[0][0]).toBe('cn');
    expect(store.getState().language).toBe('cn');
  });

  describe('iframe handling', () => {
    const { self, top } = window;
    const resourceBaseUrl = (window as any).resourceBaseUrl;
    let iframeWrapper: ReactWrapper;

    beforeAll(() => {
      delete (window as any).top;
      delete (window as any).self;
      delete (window as any).resourceBaseUrl;
      (window as any).top = { location: { href: 'http://test.com' } };
      (window as any).self = { location: { href: 'http://test/dtale/iframe' } };
    });

    beforeEach(() => {
      iframeWrapper = buildMenu({ iframe: 'True' });
    });

    afterAll(() => {
      window.top = top;
      window.self = self;
      (window as any).resourceBaseUrl = resourceBaseUrl;
    });

    it('correctly opens new windows', () => {
      (window as any).resourceBaseUrl = '/test-route/';
      iframeWrapper.find(DescribeOption).simulate('click');
      expect(openSpy).toHaveBeenLastCalledWith('/test-route/dtale/popup/describe/1', '_blank');
      iframeWrapper.find(ChartsOption).simulate('click');
      expect(openSpy).toHaveBeenLastCalledWith('/test-route/dtale/charts/1', '_blank');
      iframeWrapper.find(InstancesOption).simulate('click');
      expect(openSpy).toHaveBeenLastCalledWith(
        '/test-route/dtale/popup/instances/1',
        '_blank',
        'titlebar=1,location=1,status=1,width=750,height=450',
      );
    });
  });
});
