import * as React from 'react';

import { useAppSelector } from '../../redux/hooks';
import { selectSettings } from '../../redux/selectors';
import { ColumnDef } from '../DataViewerState';
import * as gu from '../gridUtils';

/** Component properties for DataViewerMenuHolder */
interface DataViewerDimensionsProps {
  style: React.CSSProperties;
  columns: ColumnDef[];
  rowCount: number;
}

export const DataViewerDimensions: React.FC<DataViewerDimensionsProps> = ({ style, columns, rowCount }) => {
  const settings = useAppSelector(selectSettings);

  const colCount = React.useMemo(
    () => gu.getActiveCols(columns, settings.backgroundMode).length,
    [columns, settings.backgroundMode],
  );

  return (
    <div style={style} className="menu-toggle">
      <div className="crossed">
        <div className="rows">{Math.max(rowCount - 1, 0)}</div>
        <div className="cols">{Math.max(colCount - 1, 0)}</div>
      </div>
    </div>
  );
};
