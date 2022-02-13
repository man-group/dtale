import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { openMenu } from '../../menuUtils';
import { ActionType } from '../../redux/actions/AppActions';
import { AppState } from '../../redux/state/AppState';
import { ColumnDef } from '../DataViewerState';
import * as gu from '../gridUtils';

/** Component properties for DataViewerMenuHolder */
interface DatViewerMenuHolderProps {
  style: React.CSSProperties;
  columns: ColumnDef[];
  rowCount: number;
}

export const DataViewerMenuHolder: React.FC<DatViewerMenuHolderProps> = ({ style, columns, rowCount }) => {
  const { theme, menuPinned, menuOpen, settings } = useSelector((state: AppState) => state);
  const dispatch = useDispatch();
  const menuToggle = React.useRef<HTMLDivElement>(null);

  const colCount = React.useMemo(
    () => gu.getActiveCols(columns, settings.backgroundMode).length,
    [columns, settings.backgroundMode],
  );
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
            <span>&#8227;</span>
          </div>
        )}
        <div className="rows">{Math.max(rowCount - 1, 0)}</div>
        <div className="cols">{Math.max(colCount - 1, 0)}</div>
      </div>
    </div>
  );
};
