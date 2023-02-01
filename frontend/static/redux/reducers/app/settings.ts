import { ActionType, AppActionTypes } from '../../actions/AppActions';
import { QueryEngine, ThemeType, Version } from '../../state/AppState';
import { getHiddenValue, toBool, toFloat } from '../utils';

export const hideShutdown = (state = false, action: AppActionTypes): boolean => {
  switch (action.type) {
    case ActionType.INIT_PARAMS:
      return toBool(getHiddenValue('hide_shutdown'));
    case ActionType.UPDATE_HIDE_SHUTDOWN:
      return action.value;
    case ActionType.LOAD_PREVIEW:
      return true;
    default:
      return state;
  }
};

export const hideHeaderEditor = (state = false, action: AppActionTypes): boolean => {
  switch (action.type) {
    case ActionType.INIT_PARAMS:
      return toBool(getHiddenValue('hide_header_editor'));
    case ActionType.UPDATE_HIDE_HEADER_EDITOR:
      return action.value;
    case ActionType.LOAD_PREVIEW:
      return true;
    default:
      return state;
  }
};

export const openCustomFilterOnStartup = (state = false, action: AppActionTypes): boolean => {
  switch (action.type) {
    case ActionType.INIT_PARAMS:
      return toBool(getHiddenValue('open_custom_filter_on_startup'));
    case ActionType.LOAD_PREVIEW:
      return false;
    default:
      return state;
  }
};

export const openPredefinedFiltersOnStartup = (state = false, action: AppActionTypes): boolean => {
  switch (action.type) {
    case ActionType.INIT_PARAMS:
      return (
        toBool(getHiddenValue('open_predefined_filters_on_startup')) &&
        getHiddenValue('predefined_filters') !== undefined
      );
    case ActionType.LOAD_PREVIEW:
      return false;
    default:
      return state;
  }
};

export const hideDropRows = (state = false, action: AppActionTypes): boolean => {
  switch (action.type) {
    case ActionType.INIT_PARAMS:
      return toBool(getHiddenValue('hide_drop_rows'));
    default:
      return state;
  }
};

export const allowCellEdits = (state = true, action: AppActionTypes): boolean => {
  switch (action.type) {
    case ActionType.INIT_PARAMS:
      return toBool(getHiddenValue('allow_cell_edits'));
    case ActionType.UPDATE_ALLOW_CELL_EDITS:
      return action.value;
    case ActionType.LOAD_PREVIEW:
      return false;
    default:
      return state;
  }
};

export const theme = (state = ThemeType.LIGHT, action: AppActionTypes): ThemeType => {
  switch (action.type) {
    case ActionType.INIT_PARAMS: {
      const themeStr = getHiddenValue('theme');
      const themeVal = Object.values(ThemeType).find((t) => t.valueOf() === themeStr);
      return themeVal ?? state;
    }
    case ActionType.SET_THEME: {
      const body = document.getElementsByTagName('body')[0];
      body.classList.remove(`${state}-mode`);
      body.classList.add(`${action.theme}-mode`);
      return action.theme;
    }
    default:
      return state;
  }
};

export const language = (state = 'en', action: AppActionTypes): string => {
  switch (action.type) {
    case ActionType.INIT_PARAMS:
      return getHiddenValue('language') ?? state;
    case ActionType.SET_LANGUAGE:
      return action.language;
    default:
      return state;
  }
};

export const pythonVersion = (state: Version | null = null, action: AppActionTypes): Version | null => {
  switch (action.type) {
    case ActionType.INIT_PARAMS:
    case ActionType.LOAD_PREVIEW: {
      const version = getHiddenValue('python_version');
      if (version) {
        return version.split('.').map((subVersion: string) => parseInt(subVersion, 10)) as Version;
      }
      return state;
    }
    default:
      return state;
  }
};

export const isVSCode = (state = false, action: AppActionTypes): boolean => {
  switch (action.type) {
    case ActionType.INIT_PARAMS:
      return toBool(getHiddenValue('is_vscode')) && global.top !== global.self;
    case ActionType.LOAD_PREVIEW:
      return false;
    default:
      return state;
  }
};

export const maxColumnWidth = (state: number | null = null, action: AppActionTypes): number | null => {
  switch (action.type) {
    case ActionType.INIT_PARAMS:
      return toFloat(getHiddenValue('max_column_width'), true) ?? null;
    case ActionType.UPDATE_MAX_WIDTH:
      return action.width;
    case ActionType.CLEAR_MAX_WIDTH:
      return null;
    default:
      return state;
  }
};

export const maxRowHeight = (state: number | null = null, action: AppActionTypes): number | null => {
  switch (action.type) {
    case ActionType.INIT_PARAMS:
      return toFloat(getHiddenValue('max_row_height'), true) ?? null;
    case ActionType.UPDATE_MAX_HEIGHT:
      return action.height;
    case ActionType.CLEAR_MAX_HEIGHT:
      return null;
    default:
      return state;
  }
};

export const mainTitle = (state: string | null = null, action: AppActionTypes): string | null => {
  switch (action.type) {
    case ActionType.INIT_PARAMS:
      return getHiddenValue('main_title') ?? null;
    default:
      return state;
  }
};

export const mainTitleFont = (state: string | null = null, action: AppActionTypes): string | null => {
  switch (action.type) {
    case ActionType.INIT_PARAMS:
      return getHiddenValue('main_title_font') ?? null;
    default:
      return state;
  }
};

export const queryEngine = (state = QueryEngine.PYTHON, action: AppActionTypes): QueryEngine => {
  switch (action.type) {
    case ActionType.INIT_PARAMS: {
      const engineStr = getHiddenValue('query_engine');
      const queryEngineVal = Object.values(QueryEngine).find((key) => key.valueOf() === engineStr);
      return queryEngineVal ?? state;
    }
    case ActionType.SET_QUERY_ENGINE:
      return action.engine;
    default:
      return state;
  }
};

export const showAllHeatmapColumns = (state = false, action: AppActionTypes): boolean => {
  switch (action.type) {
    case ActionType.UPDATE_SHOW_ALL_HEATMAP_COLUMNS:
      return action.showAllHeatmapColumns;
    default:
      return state;
  }
};
