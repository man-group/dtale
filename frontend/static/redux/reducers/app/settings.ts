import { createReducer } from '@reduxjs/toolkit';

import { AppActions } from '../../actions/AppActions';
import { QueryEngine, ThemeType, Version } from '../../state/AppState';
import { getHiddenValue, toBool, toFloat, toJson } from '../utils';

export const hideShutdown = createReducer(false, (builder) =>
  builder
    .addCase(AppActions.InitAction, () => toBool(getHiddenValue('hide_shutdown')))
    .addCase(AppActions.UpdateHideShutdown, (state, { payload }) => payload)
    .addCase(AppActions.LoadPreviewAction, () => true),
);

export const hideHeaderEditor = createReducer(false, (builder) =>
  builder
    .addCase(AppActions.InitAction, () => toBool(getHiddenValue('hide_header_editor')))
    .addCase(AppActions.UpdateHideHeaderEditor, (state, { payload }) => payload)
    .addCase(AppActions.LoadPreviewAction, () => true),
);

export const lockHeaderMenu = createReducer(false, (builder) =>
  builder
    .addCase(AppActions.InitAction, () => toBool(getHiddenValue('lock_header_menu')))
    .addCase(AppActions.UpdateLockHeaderMenu, (state, { payload }) => payload)
    .addCase(AppActions.LoadPreviewAction, () => true),
);

export const hideHeaderMenu = createReducer(false, (builder) =>
  builder
    .addCase(AppActions.InitAction, () => toBool(getHiddenValue('hide_header_menu')))
    .addCase(AppActions.UpdateHideHeaderMenu, (state, { payload }) => payload)
    .addCase(AppActions.LoadPreviewAction, () => true),
);

export const hideMainMenu = createReducer(false, (builder) =>
  builder
    .addCase(AppActions.InitAction, () => toBool(getHiddenValue('hide_main_menu')))
    .addCase(AppActions.UpdateHideMainMenu, (state, { payload }) => payload)
    .addCase(AppActions.LoadPreviewAction, () => true),
);

export const hideColumnMenus = createReducer(false, (builder) =>
  builder
    .addCase(AppActions.InitAction, () => toBool(getHiddenValue('hide_column_menus')))
    .addCase(AppActions.UpdateHideColumnMenus, (state, { payload }) => payload)
    .addCase(AppActions.LoadPreviewAction, () => true),
);

export const enableCustomFilters = createReducer(false, (builder) =>
  builder
    .addCase(AppActions.InitAction, () => toBool(getHiddenValue('enable_custom_filters')))
    .addCase(AppActions.UpdateEnableCustomFilters, (state, { payload }) => payload)
    .addCase(AppActions.LoadPreviewAction, () => false),
);

export const enableWebUploads = createReducer(false, (builder) =>
  builder
    .addCase(AppActions.InitAction, () => toBool(getHiddenValue('enable_web_uploads')))
    .addCase(AppActions.LoadPreviewAction, () => false),
);

export const openCustomFilterOnStartup = createReducer(false, (builder) =>
  builder
    .addCase(AppActions.InitAction, () => toBool(getHiddenValue('open_custom_filter_on_startup')))
    .addCase(AppActions.LoadPreviewAction, () => false),
);

export const openPredefinedFiltersOnStartup = createReducer(false, (builder) =>
  builder
    .addCase(
      AppActions.InitAction,
      () =>
        toBool(getHiddenValue('open_predefined_filters_on_startup')) &&
        getHiddenValue('predefined_filters') !== undefined,
    )
    .addCase(AppActions.LoadPreviewAction, () => false),
);

export const hideDropRows = createReducer(false, (builder) =>
  builder.addCase(AppActions.InitAction, () => toBool(getHiddenValue('hide_drop_rows'))),
);

export const allowCellEdits = createReducer<boolean | string[]>(true, (builder) =>
  builder
    .addCase(AppActions.InitAction, () => toJson(getHiddenValue('allow_cell_edits')))
    .addCase(AppActions.UpdateAllowCellEdits, (state, { payload }) => payload)
    .addCase(AppActions.LoadPreviewAction, () => false),
);

export const theme = createReducer<ThemeType>(ThemeType.LIGHT, (builder) =>
  builder
    .addCase(AppActions.InitAction, (state) => {
      const themeStr = getHiddenValue('theme');
      const themeVal = Object.values(ThemeType).find((t) => t.valueOf() === themeStr);
      return themeVal ?? state;
    })
    .addCase(AppActions.SetThemeAction, (state, { payload }) => {
      const body = document.getElementsByTagName('body')[0];
      body.classList.remove(`${state}-mode`);
      body.classList.add(`${payload}-mode`);
      return payload;
    }),
);

export const language = createReducer('en', (builder) =>
  builder
    .addCase(AppActions.InitAction, (state) => getHiddenValue('language') ?? state)
    .addCase(AppActions.SetLanguageAction, (state, { payload }) => payload),
);

export const pythonVersion = createReducer<Version | null>(null, (builder) =>
  builder
    .addCase(AppActions.InitAction, (state) => {
      const version = getHiddenValue('python_version');
      if (version) {
        return version.split('.').map((subVersion: string) => parseInt(subVersion, 10)) as Version;
      }
      return state;
    })
    .addCase(AppActions.LoadPreviewAction, (state) => {
      const version = getHiddenValue('python_version');
      if (version) {
        return version.split('.').map((subVersion: string) => parseInt(subVersion, 10)) as Version;
      }
      return state;
    }),
);

export const isVSCode = createReducer(false, (builder) =>
  builder
    .addCase(AppActions.InitAction, () => toBool(getHiddenValue('is_vscode')) && global.top !== global.self)
    .addCase(AppActions.LoadPreviewAction, () => false),
);

export const isArcticDB = createReducer(0, (builder) =>
  builder
    .addCase(AppActions.InitAction, () => toFloat(getHiddenValue('is_arcticdb')) as number)
    .addCase(AppActions.LoadPreviewAction, () => 0),
);

export const arcticConn = createReducer('', (builder) =>
  builder
    .addCase(AppActions.InitAction, () => getHiddenValue('arctic_conn') ?? '')
    .addCase(AppActions.LoadPreviewAction, () => ''),
);

export const columnCount = createReducer(0, (builder) =>
  builder
    .addCase(AppActions.InitAction, () => toFloat(getHiddenValue('column_count')) as number)
    .addCase(AppActions.LoadPreviewAction, () => 0),
);

export const maxColumnWidth = createReducer<number | null>(null, (builder) =>
  builder
    .addCase(AppActions.InitAction, () => toFloat(getHiddenValue('max_column_width'), true) ?? null)
    .addCase(AppActions.UpdateMaxColumnWidthAction, (state, { payload }) => payload)
    .addCase(AppActions.ClearMaxWidthAction, () => null),
);

export const maxRowHeight = createReducer<number | null>(null, (builder) =>
  builder
    .addCase(AppActions.InitAction, () => toFloat(getHiddenValue('max_row_height'), true) ?? null)
    .addCase(AppActions.UpdateMaxRowHeightAction, (state, { payload }) => payload)
    .addCase(AppActions.ClearMaxHeightAction, () => null),
);

export const mainTitle = createReducer<string | null>(null, (builder) =>
  builder.addCase(AppActions.InitAction, () => getHiddenValue('main_title') ?? null),
);

export const mainTitleFont = createReducer<string | null>(null, (builder) =>
  builder.addCase(AppActions.InitAction, () => getHiddenValue('main_title_font') ?? null),
);

export const queryEngine = createReducer<QueryEngine>(QueryEngine.PYTHON, (builder) =>
  builder
    .addCase(AppActions.InitAction, (state) => {
      const engineStr = getHiddenValue('query_engine');
      const queryEngineVal = Object.values(QueryEngine).find((key) => key.valueOf() === engineStr);
      return queryEngineVal ?? state;
    })
    .addCase(AppActions.SetQueryEngineAction, (state, { payload }) => payload),
);

export const showAllHeatmapColumns = createReducer(false, (builder) =>
  builder.addCase(AppActions.UpdateShowAllHeatmapColumnsAction, (state, { payload }) => payload),
);
