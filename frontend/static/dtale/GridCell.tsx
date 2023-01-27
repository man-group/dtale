import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { Checkbox } from '../popups/create/LabeledCheckbox';
import { ActionType, HideMenuTooltipAction, ShowMenuTooltipAction } from '../redux/actions/AppActions';
import { AppState } from '../redux/state/AppState';

import * as bu from './backgroundUtils';
import { ColumnDef, DataRecord, DataViewerData, DataViewerPropagateState, StringColumnFormat } from './DataViewerState';
import { GridCellEditor } from './GridCellEditor';
import * as gu from './gridUtils';
import Header from './Header';
import { isInRange } from './rangeSelectUtils';

/** Component properties for GridCell */
export interface GridCellProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  columns: ColumnDef[];
  data: DataViewerData;
  rowCount: number;
  min?: number;
  max?: number;
  propagateState: DataViewerPropagateState;
}

const GridCell: React.FC<GridCellProps & WithTranslation> = ({
  columnIndex,
  rowIndex,
  style,
  columns,
  data,
  rowCount,
  min,
  max,
  propagateState,
  t,
}) => {
  const { editedCell, allowCellEdits, settings, ...rangeState } = useSelector((state: AppState) => state);
  const dispatch = useDispatch();
  const showTooltip = (element: HTMLElement, content: React.ReactNode): ShowMenuTooltipAction =>
    dispatch({ type: ActionType.SHOW_MENU_TOOLTIP, element, content });
  const hideTooltip = (): HideMenuTooltipAction => dispatch({ type: ActionType.HIDE_MENU_TOOLTIP });

  const ref = React.useRef<HTMLDivElement>(null);

  const colCfg = React.useMemo(() => {
    return gu.getCol(columnIndex, columns, settings.backgroundMode);
  }, [columns, settings.backgroundMode]);

  if (rowIndex === 0) {
    return (
      <Header
        columnIndex={columnIndex}
        style={style}
        columns={columns}
        rowCount={rowCount}
        propagateState={propagateState}
      />
    );
  }

  const buildCellClassName = (): string => {
    const classes = ['cell'];
    if (allowCellEdits) {
      classes.push('editable');
    }
    if (isInRange(columnIndex, rowIndex, rangeState)) {
      classes.push('in-range');
    }
    return classes.join(' ');
  };

  const buildStyle = (
    rec: DataRecord,
    valueStyle: React.CSSProperties,
    row: Record<string, DataRecord>,
  ): { style: React.CSSProperties; backgroundClass: string } => {
    const backgroundStyle = bu.updateBackgroundStyles(colCfg!, rec, row, settings, min, max);
    const backgroundClass = Object.keys(backgroundStyle).length ? ' background' : '';
    return { style: { ...valueStyle, ...rec.style, ...backgroundStyle }, backgroundClass };
  };

  const cellIdx = `${columnIndex}|${rowIndex}`;
  const row = data[rowIndex - 1] ?? {};
  const rec = row[colCfg?.name ?? ''] ?? {};
  const isBool = gu.ColumnType.BOOL === gu.findColType(colCfg?.dtype);
  if (columnIndex > 0 && cellIdx === editedCell) {
    return (
      <div
        ref={ref}
        className="cell"
        style={{ ...style, padding: 0 }}
        onMouseOver={() => showTooltip(ref.current!, t(isBool ? 'bool_editing' : 'editing'))}
        onMouseOut={hideTooltip}
      >
        <GridCellEditor
          {...{ value: `${rec.raw ?? ''}`, data, columns, rowCount, colCfg: colCfg!, propagateState, rowIndex }}
        />
      </div>
    );
  }
  let value: React.ReactNode = '-';
  // wide strings need to be displayed to the left so they are easier to read
  let valueStyle: React.CSSProperties =
    (style.width ?? 0) > 350 && gu.isStringCol(colCfg?.dtype) ? { textAlign: 'left' } : {};
  const divProps: React.HTMLAttributes<HTMLDivElement> = {};
  let className = buildCellClassName();
  if (colCfg?.name) {
    value = rec.view;
    const styleProps = buildStyle(rec, valueStyle, row);
    className = `${className}${styleProps.backgroundClass}`;
    valueStyle = styleProps.style;
    if ([gu.ColumnType.STRING, gu.ColumnType.DATE].includes(gu.findColType(colCfg.dtype)) && rec.raw !== rec.view) {
      divProps.title = `${rec.raw ?? ''}`;
    }
    (divProps as any).cell_idx = cellIdx;
    if (isBool && ['true', 'false'].includes(`${rec.raw ?? ''}`.toLowerCase())) {
      value = <Checkbox value={'true' === `${rec.raw ?? ''}`.toLowerCase()} {...divProps} />;
    } else if (settings.columnFormats?.[colCfg.name]?.fmt?.link === true) {
      value = (
        <a href={`${rec.raw ?? ''}`} target="_blank" rel="noopener noreferrer">
          {value}
        </a>
      );
    } else if ((settings.columnFormats?.[colCfg.name]?.fmt as StringColumnFormat)?.html === true) {
      value = <div className="html-cell" dangerouslySetInnerHTML={{ __html: value as string }} />;
    }
  }
  return (
    <div className={className} style={{ ...style, ...valueStyle }} {...divProps}>
      {colCfg?.resized ? (
        <div className="resized" {...{ cell_idx: cellIdx }}>
          {value}
        </div>
      ) : (
        value
      )}
    </div>
  );
};

export default withTranslation('menu_description')(GridCell);
