import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { ActionType, ClearEditAction, OpenChartAction } from '../redux/actions/AppActions';
import * as chartActions from '../redux/actions/charts';
import { AppState, Popups } from '../redux/state/AppState';

import { ColumnDef, DataViewerData, DataViewerPropagateState } from './DataViewerState';
import * as editUtils from './edited/editUtils';

/** Component properties for GridCellEditor */
export interface GridCellEditorProps {
  value?: string;
  colCfg: ColumnDef;
  rowIndex: number;
  propagateState: DataViewerPropagateState;
  data: DataViewerData;
  columns: ColumnDef[];
  rowCount: number;
}

export const GridCellEditor: React.FC<GridCellEditorProps> = ({
  colCfg,
  rowIndex,
  propagateState,
  data,
  columns,
  rowCount,
  ...props
}) => {
  const { dataId, settings, maxColumnWidth } = useSelector((state: AppState) => ({
    dataId: state.dataId,
    settings: state.settings,
    maxColumnWidth: state.maxColumnWidth,
  }));
  const dispatch = useDispatch();
  const openChart = (chartData: Popups): OpenChartAction => dispatch(chartActions.openChart(chartData));
  const clearEdit = (): ClearEditAction => dispatch({ type: ActionType.CLEAR_EDIT });

  const [value, setValue] = React.useState(props.value ?? '');
  const input = React.useRef<HTMLInputElement>(null);

  const escapeHandler = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      clearEdit();
    }
  };

  React.useEffect(() => {
    input.current?.focus();
    window.addEventListener('keydown', escapeHandler);
    return () => window.removeEventListener('keydown', escapeHandler);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent): void => {
    editUtils.onKeyDown(e, colCfg, rowIndex, value, props.value, {
      dataId,
      settings,
      maxColumnWidth: maxColumnWidth ?? undefined,
      clearEdit,
      openChart,
      propagateState,
      data,
      columns,
      rowCount,
    });
  };

  return (
    <input
      data-testid="grid-cell-editor"
      ref={input}
      style={{ background: 'lightblue', width: 'inherit' }}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={onKeyDown}
    />
  );
};
