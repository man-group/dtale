import * as React from 'react';
import { useSelector } from 'react-redux';

import { openMenu } from '../../menuUtils';
import { AppState } from '../../redux/state/AppState';
import { ColumnDef, DataViewerPropagateState } from '../DataViewerState';
import * as gu from '../gridUtils';

/** Component properties for DataViewerMenuHolder */
interface DatViewerMenuHolderProps {
  style: React.CSSProperties;
  columns: ColumnDef[];
  backgroundMode?: string;
  menuOpen: boolean;
  rowCount: number;
  propagateState: DataViewerPropagateState;
}

export const DataViewerMenuHolder: React.FC<DatViewerMenuHolderProps> = ({
  style,
  columns,
  backgroundMode,
  menuOpen,
  rowCount,
  propagateState,
}) => {
  const { theme, menuPinned } = useSelector((state: AppState) => ({
    theme: state.theme,
    menuPinned: state.menuPinned,
  }));
  const menuToggle = React.useRef<HTMLDivElement>(null);

  const colCount = React.useMemo(() => gu.getActiveCols({ columns, backgroundMode }).length, [columns, backgroundMode]);
  const menuHandler = openMenu(
    () => propagateState({ menuOpen: true }),
    () => propagateState({ menuOpen: false }),
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
