import { render } from '@testing-library/react';
import * as React from 'react';
import { Provider } from 'react-redux';

import { buildRangeState } from '../../dtale/rangeSelectUtils';
import { PopupType } from '../../redux/state/AppState';
import reduxUtils from '../redux-test-utils';

describe('reducer tests', () => {
  it('dtale: missing hidden input', () => {
    const store = reduxUtils.createDtaleStore();
    const body = document.getElementsByTagName('body')[0];
    body.innerHTML = `<div id="content" style="height: 1000px;width: 1000px;"></div>`;

    render(
      <Provider store={store}>
        <div />
      </Provider>,
      {
        container: document.getElementById('content') ?? undefined,
      },
    );
    const state = {
      chartData: { visible: false, type: PopupType.HIDDEN },
      hideShutdown: false,
      hideHeaderEditor: false,
      lockHeaderMenu: false,
      hideHeaderMenu: false,
      hideMainMenu: false,
      hideColumnMenus: false,
      enableCustomFilters: false,
      enableWebUploads: false,
      hideDropRows: false,
      iframe: false,
      columnMenuOpen: false,
      selectedCol: null,
      selectedColRef: null,
      dataId: '',
      editedCell: null,
      xarray: false,
      xarrayDim: {},
      allowCellEdits: true,
      theme: 'light',
      language: 'en',
      filteredRanges: {},
      settings: {
        allow_cell_edits: true,
        hide_shutdown: false,
        precision: 2,
        predefinedFilters: {},
        verticalHeaders: false,
        hide_header_editor: false,
        lock_header_menu: false,
        hide_header_menu: false,
        hide_main_menu: false,
        hide_column_menus: false,
        enable_custom_filters: false,
      },
      pythonVersion: null,
      isPreview: false,
      menuPinned: false,
      menuTooltip: {
        visible: false,
      },
      ribbonDropdown: {
        visible: false,
      },
      ribbonMenuOpen: false,
      sidePanel: {
        visible: false,
      },
      dataViewerUpdate: null,
      auth: false,
      username: null,
      predefinedFilters: [],
      maxColumnWidth: null,
      maxRowHeight: null,
      dragResize: null,
      editedTextAreaHeight: 0,
      mainTitle: null,
      mainTitleFont: null,
      showAllHeatmapColumns: false,
      isVSCode: false,
      isArcticDB: 0.0,
      arcticConn: '',
      columnAggregations: null,
      columnCount: 0,
      queryEngine: 'python',
      openCustomFilterOnStartup: false,
      openPredefinedFiltersOnStartup: false,
      menuOpen: false,
      formattingOpen: null,
      ...buildRangeState(),
    };
    expect(state).toEqual(store.getState());
  });
});
