import { createSelector } from '@reduxjs/toolkit';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Bouncer } from '../../Bouncer';
import { openMenu } from '../../menuUtils';
import { ActionType } from '../../redux/actions/AppActions';
import { selectColumnCount, selectMenuOpen, selectMenuPinned, selectTheme } from '../../redux/selectors';
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
  [selectTheme, selectMenuPinned, selectMenuOpen, selectColumnCount],
  (theme, menuPinned, menuOpen, columnCount) => ({ theme, menuPinned, menuOpen, columnCount }),
);

export const DataViewerMenuHolder: React.FC<DatViewerMenuHolderProps> = ({ loading, style, columns, rowCount }) => {
  const { theme, menuPinned, menuOpen, columnCount } = useSelector(selectResult);
  const dispatch = useDispatch();
  const menuToggle = React.useRef<HTMLDivElement>(null);

  const menuHandler = openMenu(
    () => dispatch({ type: ActionType.OPEN_MENU }),
    () => dispatch({ type: ActionType.CLOSE_MENU }),
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
            }}
            onClick={menuHandler}
          >
            {loading ? <Bouncer /> : <span>&#8227;</span>}
          </div>
        )}
        <div className="rows">{Math.max(rowCount - 1, 0)}</div>
        <div className="cols">{Math.max(columnCount, 0)}</div>
      </div>
    </div>
  );
};
