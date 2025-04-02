import { PayloadAction } from '@reduxjs/toolkit';

import { DataViewerUpdate, DataViewerUpdateType, InstanceSettings } from '../redux/state/AppState';

import { ColumnDef, DataViewerData, DataViewerPropagateState, PropagatedState } from './DataViewerState';
import * as gu from './gridUtils';

const toggleColumns = (columns: ColumnDef[], columnsToToggle: Record<string, boolean>): Partial<PropagatedState> => ({
  columns: columns.map((col) => ({ ...col, visible: columnsToToggle[col.name] ?? col.visible })),
  triggerResize: true,
});

const dropColumns = (columns: ColumnDef[], columnsToDrop: string[]): Partial<PropagatedState> => ({
  columns: columns.filter((col) => !columnsToDrop.includes(col.name)),
  triggerResize: true,
});

export const handleReduxState = (
  columns: ColumnDef[],
  data: DataViewerData,
  rowCount: number,
  dataViewerUpdate: DataViewerUpdate | null,
  clearDataViewerUpdate: () => PayloadAction,
  propagateState: DataViewerPropagateState,
  settings: InstanceSettings,
): void => {
  if (dataViewerUpdate) {
    switch (dataViewerUpdate.type) {
      case DataViewerUpdateType.TOGGLE_COLUMNS:
        propagateState(toggleColumns(columns, dataViewerUpdate.columns), clearDataViewerUpdate);
        break;
      case DataViewerUpdateType.DROP_COLUMNS:
        propagateState(dropColumns(columns, dataViewerUpdate.columns), clearDataViewerUpdate);
        break;
      case DataViewerUpdateType.UPDATE_MAX_WIDTH:
        propagateState(
          {
            columns: columns.map((c) => ({
              ...c,
              ...gu.calcColWidth(
                { ...c, resized: false },
                data,
                rowCount,
                settings.sortInfo,
                settings.backgroundMode,
                dataViewerUpdate.width,
              ),
            })),
            triggerResize: true,
          },
          clearDataViewerUpdate,
        );
        break;
      case DataViewerUpdateType.UPDATE_MAX_HEIGHT:
        propagateState({ triggerResize: true }, clearDataViewerUpdate);
        break;
      default:
        break;
    }
  }
};
