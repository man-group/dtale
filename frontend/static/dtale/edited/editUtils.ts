import { ClearEditAction, OpenChartAction } from '../../redux/actions/AppActions';
import { InstanceSettings, Popups, PopupType } from '../../redux/state/AppState';
import { ColumnDef, DataViewerData, DataViewerPropagateState } from '../DataViewerState';
import * as gu from '../gridUtils';
import * as serverState from '../serverStateManagement';

/** Component properties for EditedCellInfo */
export interface EditedCellInfoProps {
  propagateState: DataViewerPropagateState;
  data: DataViewerData;
  columns: ColumnDef[];
  rowCount: number;
}

/** Properties for base onKeyDown handler */
interface CellEditKeyDownProps extends EditedCellInfoProps {
  dataId: string;
  settings: InstanceSettings;
  maxColumnWidth?: number;
  clearEdit: () => ClearEditAction;
  openChart: (chartData: Popups) => OpenChartAction;
}

export const onKeyDown = async (
  e: React.KeyboardEvent,
  colCfg: ColumnDef,
  rowIndex: number,
  value: string,
  origValue: string | undefined,
  props: CellEditKeyDownProps,
): Promise<void> => {
  if (e.key === 'Enter') {
    const { data, columns, rowCount, propagateState, dataId, settings, maxColumnWidth } = props;
    if (value === origValue) {
      props.clearEdit();
      return;
    }
    const response = await serverState.editCell(dataId, colCfg.name, rowIndex - 1, value);
    if (response?.error) {
      props.openChart({ ...response, error: response?.error, type: PopupType.ERROR, visible: true });
      return;
    }
    const updatedData = { ...data };
    updatedData[rowIndex - 1][colCfg.name] = gu.buildDataProps(colCfg, value, settings);
    const width = gu.calcColWidth(colCfg, data, rowCount, settings.sortInfo, settings.backgroundMode, maxColumnWidth);
    const updatedColumns = columns.map((c) => ({
      ...c,
      ...(c.name === colCfg.name ? width : {}),
    }));
    propagateState({ columns: updatedColumns, data: updatedData, triggerResize: true }, props.clearEdit);
  }
  if (gu.ColumnType.BOOL === gu.findColType(colCfg?.dtype) && e.key === 'n') {
    await onKeyDown({ key: 'Enter' } as any as React.KeyboardEvent, colCfg, rowIndex, 'nan', origValue, props);
  }
};
