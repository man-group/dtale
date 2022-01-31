import { mount } from 'enzyme';
import _ from 'lodash';
import React from 'react';
import { Provider } from 'react-redux';

import CorrelationsOption from '../../../dtale/menu/CorrelationsOption';
import GageRnROption from '../../../dtale/menu/GageRnROption';
import { LanguageOption } from '../../../dtale/menu/LanguageOption';
import MergeOption from '../../../dtale/menu/MergeOption';
import MissingOption from '../../../dtale/menu/MissingOption';
import { PPSOption } from '../../../dtale/menu/PPSOption';
import { PredefinedFiltersOption } from '../../../dtale/menu/PredefinedFiltersOption';
import ShowHideColumnsOption from '../../../dtale/menu/ShowHideColumnsOption';
import TimeseriesAnalysisOption from '../../../dtale/menu/TimeseriesAnalysisOption';
import * as serverState from '../../../dtale/serverStateManagement';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, PREDEFINED_FILTERS, tickUpdate } from '../../test-utils';
import DescribeOption from '../../../dtale/menu/DescribeOption';
import ChartsOption from '../../../dtale/menu/ChartsOption';
import InstancesOption from '../../../dtale/menu/InstancesOption';

describe('DataViewerMenu tests', () => {
  const { open } = window;
  let DataViewerMenu, store, updateLanguageSpy;

  beforeAll(() => {
    delete window.open;
    window.open = jest.fn();
  });

  beforeEach(() => {
    updateLanguageSpy = jest.spyOn(serverState, 'updateLanguage');
    updateLanguageSpy.mockResolvedValue(Promise.resolve({ success: true }));
    DataViewerMenu = require('../../../dtale/menu/DataViewerMenu').DataViewerMenu;
    store = reduxUtils.createDtaleStore();
  });

  afterEach(() => {
    window.open.mockReset();
  });

  afterAll(() => {
    window.open = open;
    jest.restoreAllMocks();
  });

  const buildMenu = (hiddenProps, props) => {
    buildInnerHTML({ settings: '', ...hiddenProps }, store);
    const finalProps = {
      openChart: _.noop,
      propagateState: _.noop,
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
        attachTo: document.getElementById('content'),
      },
    );
  };

  it('DataViewerMenu: render', () => {
    const result = buildMenu({}, {});
    expect(result.find('ul li span.toggler-action').last().text()).toBe('Shutdown');
  });

  it('DataViewerMenu: hide_shutdown == True', () => {
    const result = buildMenu({ hideShutdown: 'True' });
    expect(
      result
        .find('ul li span.toggler-action')
        .findWhere((b) => _.includes(b.text(), 'Instances'))
        .first()
        .text(),
    ).toBe('Instances 1');
  });

  it('DataViewerMenu: processes == 2', () => {
    const result = buildMenu({ hideShutdown: 'True', processes: 2 });
    expect(
      result
        .find('ul li span.toggler-action')
        .findWhere((b) => _.includes(b.text(), 'Instances'))
        .first()
        .text(),
    ).toBe('Instances 2');
  });

  it('opens side panel', () => {
    const result = buildMenu({}, { predefinedFilters: PREDEFINED_FILTERS });
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
    const result = buildMenu({});
    result.find(MergeOption).props().open();
    expect(window.open).toHaveBeenCalledWith('/dtale/popup/merge', '_blank');
  });

  it('updates languages', async () => {
    const result = buildMenu({});
    await result.find(LanguageOption).find('button').last().simulate('click');
    await tickUpdate(result);
    expect(updateLanguageSpy.mock.calls[0][0]).toBe('cn');
    expect(store.getState().language).toBe('cn');
  });

  describe('iframe handling', () => {
    const { resourceBaseUrl, self, top } = window;
    let iframeWrapper;

    beforeAll(() => {
      delete window.top;
      delete window.self;
      delete window.resourceBaseUrl;
      window.top = { location: { href: 'http://test.com' } };
      window.self = { location: { href: 'http://test/dtale/iframe' } };
    });

    beforeEach(() => {
      iframeWrapper = buildMenu({ iframe: true });
    });

    afterAll(() => {
      window.top = top;
      window.self = self;
      window.resourceBaseUrl = resourceBaseUrl;
    });

    it('correctly opens new windows', () => {
      window.resourceBaseUrl = '/test-route/';
      iframeWrapper.find(DescribeOption).simulate('click');
      expect(window.open.mock.calls[0][0]).toBe('/test-route/dtale/popup/describe/1');
      iframeWrapper.find(ChartsOption).simulate('click');
      expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe('/test-route/dtale/charts/1');
      iframeWrapper.find(InstancesOption).simulate('click');
      expect(window.open.mock.calls[window.open.mock.calls.length - 1][0]).toBe('/test-route/dtale/popup/instances/1');
    });
  });
});
