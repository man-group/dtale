import { TFunction } from 'i18next';
import * as React from 'react';
import Draggable, { DraggableEvent } from 'react-draggable';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { ActionType, DragResizeAction, StopResizeAction } from '../../redux/actions/AppActions';
import { AppState } from '../../redux/state/AppState';
import * as bu from '../backgroundUtils';
import { ColumnDef, DataViewerPropagateState } from '../DataViewerState';
import * as gu from '../gridUtils';

import { DataViewerDimensions } from './DataViewerDimensions';

export const SORT_CHARS = {
  ASC: String.fromCharCode(9650),
  DESC: String.fromCharCode(9660),
};

const buildMarkup = (
  t: TFunction,
  colCfg: ColumnDef,
  colName: string,
  backgroundMode?: string,
): { headerStyle: React.CSSProperties; colNameMarkup: React.ReactNode; className: string } => {
  let headerStyle: React.CSSProperties = {};
  let className = '';
  let colNameMarkup: React.ReactNode = colName;
  if (backgroundMode === 'dtypes') {
    const dtypeStyle = bu.dtypeHighlighting(colCfg);
    headerStyle = { ...dtypeStyle, ...headerStyle };
    colNameMarkup = <div title={`DType: ${colCfg?.dtype}`}>{colName}</div>;
    className = Object.keys(dtypeStyle).length ? ' background' : '';
  }
  if (backgroundMode === 'missing' && colCfg?.hasMissing) {
    colNameMarkup = <div title={`${t('Missing Values')}: ${colCfg.hasMissing}`}>{`${bu.missingIcon}${colName}`}</div>;
    className = ' background';
  }
  if (backgroundMode === 'outliers' && colCfg?.hasOutliers) {
    colNameMarkup = <div title={`${t('Outliers')}: ${colCfg.hasOutliers}`}>{`${bu.outlierIcon} ${colName}`}</div>;
    className = ' background';
  }
  if (backgroundMode === 'lowVariance' && colCfg?.lowVariance) {
    colNameMarkup = <div title={`${t('Low Variance')}: ${colCfg.lowVariance}`}>{`${bu.flagIcon} ${colName}`}</div>;
    className = ' background';
  }
  return { headerStyle, colNameMarkup, className };
};

const cancelEvents = (e: DraggableEvent, func: () => void): void => {
  e.preventDefault();
  e.stopPropagation();
  func();
};

/** Component properties for Header */
export interface HeaderProps {
  columns: ColumnDef[];
  rowCount: number;
  columnIndex: number;
  style: React.CSSProperties;
  propagateState: DataViewerPropagateState;
  maxRowHeight?: number;
}

const Header: React.FC<HeaderProps & WithTranslation> = ({
  columns,
  rowCount,
  columnIndex,
  style,
  propagateState,
  maxRowHeight,
  t,
}) => {
  const { settings } = useSelector((state: AppState) => state);
  const dispatch = useDispatch();
  const updateDragResize = (x: number): DragResizeAction => dispatch({ type: ActionType.DRAG_RESIZE, x });
  const stopDragResize = (): StopResizeAction => dispatch({ type: ActionType.STOP_RESIZE });

  const [drag, setDrag] = React.useState(false);
  const [colWidth, setColWidth] = React.useState<number>();
  const headerRef = React.useRef<HTMLDivElement>(null);
  const [colCfg, colName] = React.useMemo(() => {
    const cfg = gu.getCol(columnIndex, columns, settings.backgroundMode);
    return [cfg, cfg?.name ?? ''];
  }, [columns, settings.backgroundMode]);

  const resizeStart = (e: DraggableEvent): void => {
    setDrag(true);
    setColWidth(colCfg?.width);
    updateDragResize((e as React.MouseEvent).clientX);
  };

  const resizeCol = (e: DraggableEvent, deltaX: number): void => {
    const width = Math.max((colWidth ?? colCfg?.width ?? 0) + deltaX, 10);
    setColWidth(width);
    updateDragResize((e as React.MouseEvent).clientX);
  };

  const resizeStop = (): void => {
    const updatedColumns = columns.map((col) =>
      col.name === colName ? { ...col, width: colWidth, resized: true } : { ...col },
    );
    setDrag(false);
    setColWidth(undefined);
    propagateState({ columns: updatedColumns, triggerResize: true });
    stopDragResize();
  };

  if (columnIndex === 0) {
    return <DataViewerDimensions style={style} columns={columns} rowCount={rowCount} />;
  }

  const sortDir = (settings.sortInfo?.find(([col, _dir]) => col === colName) || [null, null])[1];
  let headerStyle = { ...style };
  const markupProps = buildMarkup(t, colCfg!, colName, settings.backgroundMode);
  headerStyle = { ...headerStyle, ...markupProps.headerStyle };

  const classes = ['text-nowrap'];
  const textStyle: React.CSSProperties = { cursor: 'default' };
  if (!drag && colCfg?.resized) {
    classes.push('resized');
  }
  if (settings.verticalHeaders) {
    headerStyle.height = 'inherit';
    textStyle.width = gu.getRowHeight(0, columns, settings.backgroundMode, maxRowHeight, settings.verticalHeaders) - 15;
    textStyle.textAlign = 'left';
    classes.push('rotate-header');
  } else {
    classes.push('w-100');
  }
  return (
    <div
      className={`headerCell ${markupProps.className}${drag ? ' active-resize' : ''}`}
      style={{ ...headerStyle, ...(drag ? { width: colWidth } : {}) }}
      ref={headerRef}
    >
      <div className={classes.join(' ')} style={textStyle}>
        {sortDir ? SORT_CHARS[sortDir] : ''}
        {markupProps.colNameMarkup}
      </div>
      <Draggable
        axis="x"
        defaultClassName="DragHandle"
        defaultClassNameDragging="DragHandleActive"
        onStart={(e, data) => cancelEvents(e, () => resizeStart(e))}
        onDrag={(e, { deltaX }) => cancelEvents(e, () => resizeCol(e, deltaX))}
        onStop={(e) => cancelEvents(e, resizeStop)}
        position={{ x: 0, y: 0 }}
      >
        <div className="DragHandleIcon">⋮</div>
      </Draggable>
    </div>
  );
};

export default withTranslation('main')(Header);
