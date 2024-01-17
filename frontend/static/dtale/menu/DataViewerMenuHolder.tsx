import { createSelector } from '@reduxjs/toolkit';
import * as React from 'react';

import { Bouncer } from '../../Bouncer';
import { openMenu } from '../../menuUtils';
import { AppActions } from '../../redux/actions/AppActions';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  selectColumnCount,
  selectHideMainMenu,
  selectMenuOpen,
  selectMenuPinned,
  selectTheme,
} from '../../redux/selectors';
import { ColumnDef } from '../DataViewerState';
import * as gu from '../gridUtils';

/** Component properties for DataViewerMenuHolder */
interface DatViewerMenuHolderProps {
  loading: boolean;
  style: React.CSSProperties;
  columns: ColumnDef[];
  rowCount: number;
}

const selectResult = createSelector(
  [selectTheme, selectMenuPinned, selectMenuOpen, selectColumnCount, selectHideMainMenu],
  (theme, menuPinned, menuOpen, columnCount, hideMainMenu) => ({
    theme,
    menuPinned,
    menuOpen,
    columnCount,
    hideMainMenu,
  }),
);

export const DataViewerMenuHolder: React.FC<DatViewerMenuHolderProps> = ({ loading, style, columns, rowCount }) => {
  const { theme, menuPinned, menuOpen, columnCount, hideMainMenu } = useAppSelector(selectResult);
  const dispatch = useAppDispatch();
  const menuToggle = React.useRef<HTMLDivElement>(null);

  const menuHandler = hideMainMenu
    ? () => undefined
    : openMenu(
        () => dispatch(AppActions.OpenMenuAction()),
        () => dispatch(AppActions.CloseMenuAction()),
        menuToggle,
      );

  return (
    <div ref={menuToggle} style={style} className="menu-toggle">
      <div className="crossed">
        {!menuPinned && (
          <div
            className={`grid-menu ${menuOpen ? 'open' : ''}`}
            style={{
              background: gu.isLight(theme) ? 'white' : 'black',
              color: gu.isLight(theme) ? 'black' : 'white',
              cursor: hideMainMenu ? 'default' : 'pointer',
            }}
            onClick={menuHandler}
            data-testid="main-menu-holder"
          >
            {loading ? <Bouncer /> : !hideMainMenu && <span>&#8227;</span>}
          </div>
        )}
        <div className="rows">{Math.max(rowCount - 1, 0)}</div>
        <div className="cols">{Math.max(columnCount, 0)}</div>
      </div>
    </div>
  );
};
