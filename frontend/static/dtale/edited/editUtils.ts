import { AppActions, ClearEditAction } from '../../redux/actions/AppActions';
import { InstanceSettings, Popups, PopupType } from '../../redux/state/AppState';
import { ColumnDef, DataViewerPropagateState, DataViewerState } from '../DataViewerState';
import * as gu from '../gridUtils';
import * as serverState from '../serverStateManagement';

/** Component properties for EditedCellInfo */
export interface EditedCellInfoProps {
  propagateState: DataViewerPropagateState;
  gridState: DataViewerState;
}

/** Properties for base onKeyDown handler */
interface CellEditKeyDownProps extends EditedCellInfoProps {
  dataId: string;
  settings: InstanceSettings;
  maxColumnWidth: number | null;
  clearEdit: () => ClearEditAction;
  openChart: (chartData: Popups) => AppActions<void>;
}

export const onKeyDown = async (
  e: React.KeyboardEvent,
  colCfg: ColumnDef,
  rowIndex: number,
  value: string,
  origValue: string,
  props: CellEditKeyDownProps,
): Promise<void> => {
  if (e.key === 'Enter') {
    const { gridState, propagateState, dataId, settings, maxColumnWidth } = props;
    if (value === origValue) {
      props.clearEdit();
      return;
    }
    const { data, columns, columnFormats } = gridState;
    const response = await serverState.editCell(dataId, colCfg.name, rowIndex - 1, value);
    if (response?.error) {
      props.openChart({ ...response, error: response?.error, type: PopupType.ERROR, visible: true });
      return;
    }
    const updatedData = { ...data };
    updatedData[rowIndex - 1][colCfg.name] = gu.buildDataProps(colCfg, value, columnFormats, settings);
    const width = gu.calcColWidth(colCfg, {
      ...gridState,
      ...settings,
      maxColumnWidth,
    });
    const updatedColumns = columns.map((c) => ({
      ...c,
      ...(c.name === colCfg.name ? width : {}),
    }));
    propagateState({ columns: updatedColumns, data: updatedData, triggerResize: true }, props.clearEdit);
  }
};
