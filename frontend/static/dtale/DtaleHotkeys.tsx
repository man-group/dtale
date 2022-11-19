import * as React from 'react';
import { GlobalHotKeys } from 'react-hotkeys';
import { useDispatch, useSelector } from 'react-redux';

import { ActionType, OpenChartAction, ToggleMenuAction } from '../redux/actions/AppActions';
import * as chartActions from '../redux/actions/charts';
import { AppState, Popups, PopupType } from '../redux/state/AppState';

import { ColumnDef } from './DataViewerState';
import * as menuFuncs from './menu/dataViewerMenuUtils';
import { buildCtrlColumnCopyText, buildRowCopyText, CopyText } from './rangeSelectUtils';

/** Component properties for DtaleHotkeys */
interface DtaleHotkeysProps {
  columns: ColumnDef[];
}

export const DtaleHotkeys: React.FC<DtaleHotkeysProps> = ({ columns }) => {
  const { dataId, editedCell, isVSCode, ctrlRows, ctrlCols } = useSelector((state: AppState) => state);
  const dispatch = useDispatch();
  const openChart = (chartData: Popups): OpenChartAction => dispatch(chartActions.openChart(chartData));
  const openMenu = (): ToggleMenuAction => dispatch({ type: ActionType.OPEN_MENU });
  const closeMenu = (): ToggleMenuAction => dispatch({ type: ActionType.CLOSE_MENU });

  const copyData = (): void => {
    if (ctrlRows) {
      const title = 'Copy Rows to Clipboard?';
      const callback = (copyText: CopyText): OpenChartAction =>
        openChart({
          ...copyText,
          type: PopupType.COPY_ROW_RANGE,
          title,
          size: 'sm',
          visible: true,
        });
      const params = { rows: JSON.stringify(ctrlRows.map((idx) => idx - 1)) };
      buildRowCopyText(dataId, columns, params, callback);
    } else if (ctrlCols) {
      const title = 'Copy Columns to Clipboard?';
      const callback = (copyText: CopyText): OpenChartAction =>
        openChart({
          ...copyText,
          type: PopupType.COPY_COLUMN_RANGE,
          title,
          size: 'sm',
          visible: true,
        });
      buildCtrlColumnCopyText(dataId, columns, ctrlCols, callback);
    }
  };

  if (editedCell) {
    return null;
  }
  const keyMap = {
    MENU: 'shift+m',
    DESCRIBE: 'shift+d',
    FILTER: 'shift+f',
    BUILD: 'shift+b',
    CHARTS: 'shift+c',
    CODE: 'shift+x',
    COPY: ['ctrl+c', 'command+c'],
  };
  const { MENU, DESCRIBE, FILTER, BUILD, CHARTS, CODE } = menuFuncs.buildHotkeyHandlers({
    columns,
    openChart,
    openMenu,
    closeMenu,
    dataId,
    isVSCode,
  });
  const handlers: Record<string, (keyEvent?: KeyboardEvent) => void> = {
    MENU,
    DESCRIBE,
    FILTER,
    BUILD,
    CHARTS,
    CODE,
    COPY: copyData,
  };

  return <GlobalHotKeys keyMap={keyMap} handlers={handlers} />;
};
