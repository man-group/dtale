import { createSelector, PayloadAction } from '@reduxjs/toolkit';
import * as React from 'react';
import { GlobalHotKeys } from 'react-hotkeys';

import { AppActions } from '../redux/actions/AppActions';
import * as chartActions from '../redux/actions/charts';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { selectCtrlCols, selectCtrlRows, selectDataId, selectEditedCell, selectIsVSCode } from '../redux/selectors';
import { Popups, PopupType } from '../redux/state/AppState';

import { ColumnDef } from './DataViewerState';
import * as menuFuncs from './menu/dataViewerMenuUtils';
import { buildCtrlColumnCopyText, buildRowCopyText, CopyText } from './rangeSelectUtils';

/** Component properties for DtaleHotkeys */
interface DtaleHotkeysProps {
  columns: ColumnDef[];
}

const selectResult = createSelector(
  [selectDataId, selectEditedCell, selectIsVSCode, selectCtrlRows, selectCtrlCols],
  (dataId, editedCell, isVSCode, ctrlRows, ctrlCols) => ({ dataId, editedCell, isVSCode, ctrlRows, ctrlCols }),
);

export const DtaleHotkeys: React.FC<DtaleHotkeysProps> = ({ columns }) => {
  const { dataId, editedCell, isVSCode, ctrlRows, ctrlCols } = useAppSelector(selectResult);
  const dispatch = useAppDispatch();
  const openChart = (chartData: Popups): PayloadAction<Popups> => dispatch(chartActions.openChart(chartData));
  const openMenu = (): PayloadAction<void> => dispatch(AppActions.OpenMenuAction());
  const closeMenu = (): PayloadAction<void> => dispatch(AppActions.CloseMenuAction());

  const copyData = (): void => {
    if (ctrlRows) {
      const title = 'Copy Rows to Clipboard?';
      const callback = (copyText: CopyText): PayloadAction<Popups> =>
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
      const callback = (copyText: CopyText): PayloadAction<Popups> =>
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
