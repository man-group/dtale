import { VisibilityState } from '../popups/describe/DescribeState';
import { buildURLString } from '../redux/actions/url-utils';
import { FilteredRanges, InstanceSettings, QueryEngine, RangeHighlightConfig } from '../redux/state/AppState';
import { BaseResponse, getDataFromService, postDataToService } from '../repository/GenericRepository';

import { ColumnDef, ColumnFormat, DataViewerPropagateState } from './DataViewerState';

/** Type-defintion for any callback function */
type Callback = (response?: Record<string, any>) => void;

/** Type-definition for functions returning standard success responses */
export type BaseReturn<T = BaseResponse> = Promise<T | undefined>;

const baseGetter = async <T = BaseResponse>(apiEndpoint: string): BaseReturn<T> =>
  await getDataFromService<T>(`/dtale/${apiEndpoint}`);

export const executeAction = async (route: string, dataId: string, params: Record<string, string>): BaseReturn =>
  await getDataFromService<BaseResponse>(buildURLString(`/dtale/${route}/${dataId}?`, params));

/** Parameters required for any column operation (locking or moving) */
export interface ColumnOperationProps {
  columns: ColumnDef[];
  propagateState: DataViewerPropagateState;
  dataId: string;
}

/** Different column movements */
type MoveAction = 'front' | 'back' | 'left' | 'right';

/**
 * Create a function to move a column one position left or right.
 *
 * @param selectedCol the column to move
 * @param props input parameters for column operations
 * @param action the movement to make
 * @return function to move a column
 */
function moveOnePosition(selectedCol: string, props: ColumnOperationProps, action: MoveAction): () => void {
  const { columns, propagateState, dataId } = props;
  return () => {
    const locked = columns.filter((column) => column.locked);
    const unlocked = columns.filter((column) => !column.locked);
    const selectedIdx = unlocked.findIndex(({ name }) => name === selectedCol);
    if (action === 'right' && selectedIdx === unlocked.length - 1) {
      return;
    }
    if (action === 'left' && selectedIdx === 0) {
      return;
    }
    const moveToRightIdx = action === 'right' ? selectedIdx : selectedIdx - 1;
    const moveToRight = { ...unlocked[moveToRightIdx] };
    const moveToLeftIdx = action === 'right' ? selectedIdx + 1 : selectedIdx;
    const moveToLeft = { ...unlocked[moveToLeftIdx] };
    unlocked[moveToRightIdx] = moveToLeft;
    unlocked[moveToLeftIdx] = moveToRight;
    const finalCols = [...locked, ...unlocked];
    propagateState(
      { columns: finalCols, triggerResize: true },
      async () => await executeAction('update-column-position', dataId, { col: selectedCol, action }),
    );
  };
}

/**
 * Create a function to move a column to the front or back.
 *
 * @param selectedCol the column to move
 * @param props input parameters for column operations
 * @param action the movement to make
 * @return a function to move a column
 */
function moveTo(selectedCol: string, props: ColumnOperationProps, action: MoveAction = 'front'): () => void {
  const { columns, propagateState, dataId } = props;
  return () => {
    const locked = columns.filter((column) => column.locked);
    const colsToMove = columns.filter((column) => selectedCol === column.name && !column.locked);
    const unselectedAndUnlockedCols = columns.filter(
      ({ name }) => selectedCol !== name && !locked.find((column) => column.name === name),
    );
    const finalCols =
      action === 'front'
        ? [...locked, ...colsToMove, ...unselectedAndUnlockedCols]
        : [...locked, ...unselectedAndUnlockedCols, ...colsToMove];
    propagateState(
      { columns: finalCols, triggerResize: true },
      async () => await executeAction('update-column-position', dataId, { col: selectedCol, action }),
    );
  };
}

/**
 * Create a function to pin columns to the left-hand side of the grid.
 *
 * @param selectedCols the columns to pin
 * @param props input parameters for column operations
 * @return a function to pin columns
 */
export function lockCols(selectedCols: string[], props: ColumnOperationProps): () => void {
  const { columns, propagateState, dataId } = props;
  return () => {
    const currentlyLocked = columns.filter((column) => column.locked);
    const newLocks = columns
      .filter(({ name }) => selectedCols.includes(name))
      .map((column) => ({ ...column, locked: true }));
    const locked = [...currentlyLocked, ...newLocks];
    propagateState(
      {
        columns: [...locked, ...columns.filter(({ name }) => !locked.find((column) => column.name === name))],
        triggerResize: true,
      },
      async () => await executeAction('update-locked', dataId, { col: selectedCols[0], action: 'lock' }),
    );
  };
}

/**
 * Create a function to unpin columns from the left-hand side of the grid.
 *
 * @param selectedCols the columns to unpin
 * @param props input parameters for column operations
 * @return a function unpin columns
 */
export function unlockCols(selectedCols: string[], props: ColumnOperationProps): () => void {
  const { columns, propagateState, dataId } = props;
  return () => {
    const currentlyLocked = columns.filter((column) => column.locked);
    const unlocked = currentlyLocked
      .filter(({ name }) => selectedCols.includes(name))
      .map((column) => ({ ...column, locked: false }));
    const locked = currentlyLocked.filter(({ name }) => !selectedCols.includes(name));
    propagateState(
      {
        columns: [...locked, ...unlocked, ...columns.filter((c) => !c.locked)],
        triggerResize: true,
      },
      async () => await executeAction('update-locked', dataId, { col: selectedCols[0], action: 'unlock' }),
    );
  };
}

const persistVisibility = async (dataId: string, params: Record<string, string>): BaseReturn =>
  await postDataToService<Record<string, string>, BaseResponse>(`/dtale/update-visibility/${dataId}`, params);

export const saveRangeHighlights = async (dataId: string, ranges: RangeHighlightConfig): BaseReturn =>
  await postDataToService<Record<string, string>, BaseResponse>(`/dtale/save-range-highlights/${dataId}`, {
    ranges: JSON.stringify(ranges),
  });

export const updateSettings = async (settings: Partial<InstanceSettings>, dataId: string): BaseReturn =>
  await baseGetter(buildURLString(`update-settings/${dataId}?`, { settings: JSON.stringify(settings) }));

export const dropFilteredRows = async (dataId: string, callback?: Callback): BaseReturn =>
  await baseGetter(`drop-filtered-rows/${dataId}`);

/** Response contents for settings update requests */
interface SettingResponse extends BaseResponse {
  settings: InstanceSettings;
}

export const moveFiltersToCustom = async (dataId: string): BaseReturn<SettingResponse> =>
  await baseGetter<SettingResponse>(`move-filters-to-custom/${dataId}`);

export const renameColumn = async (dataId: string, col: string, rename: string): BaseReturn =>
  await baseGetter(buildURLString(`rename-col/${dataId}`, { col, rename }));

/** Response contents for settings update requests */
interface DuplicateResponse extends BaseResponse {
  col: string;
}

export const duplicateColumn = async (dataId: string, col: string): BaseReturn<DuplicateResponse> =>
  await baseGetter(buildURLString(`duplicate-col/${dataId}`, { col }));

export const updateFormats = async (
  dataId: string,
  col: string,
  format: ColumnFormat,
  all: boolean,
  nanDisplay: string,
): BaseReturn =>
  await baseGetter(
    buildURLString(`update-formats/${dataId}`, {
      col,
      format: JSON.stringify(format),
      all: `${all}`,
      nanDisplay,
    }),
  );

export const editCell = async (dataId: string, col: string, rowIndex: number, updated: string): BaseReturn =>
  await baseGetter(buildURLString(`edit-cell/${dataId}`, { col, rowIndex: `${rowIndex}`, updated }));

export const updateTheme = async (theme: string): BaseReturn =>
  await baseGetter(buildURLString('update-theme', { theme }));

export const updateQueryEngine = async (engine: QueryEngine): BaseReturn =>
  await baseGetter(buildURLString('update-query-engine', { engine }));

export const updatePinMenu = async (pinned: boolean): BaseReturn =>
  await baseGetter(buildURLString('update-pin-menu', { pinned: `${pinned}` }));

export const updateLanguage = async (language: string): BaseReturn =>
  await baseGetter(buildURLString('update-language', { language }));

export const updateMaxColumnWidth = async (width?: number): BaseReturn =>
  await baseGetter(buildURLString('update-maximum-column-width', { width: width ? `${width}` : '' }));

export const updateMaxRowHeight = async (height?: number): BaseReturn =>
  await baseGetter(buildURLString('update-maximum-row-height', { height: height ? `${height}` : '' }));

/** Response contents for range highlight requests */
interface RangeResponse extends BaseResponse {
  ranges: FilteredRanges;
}

export const loadFilteredRanges = async (dataId: string): BaseReturn<RangeResponse> =>
  await baseGetter<RangeResponse>(`load-filtered-ranges/${dataId}`);

const deleteCols = async (dataId: string, cols: string[]): BaseReturn =>
  await baseGetter(buildURLString(`delete-col/${dataId}`, { cols: JSON.stringify(cols) }));

export const moveToFront = (selectedCol: string, props: ColumnOperationProps): (() => void) =>
  moveTo(selectedCol, props, 'front');
export const moveToBack = (selectedCol: string, props: ColumnOperationProps): (() => void) =>
  moveTo(selectedCol, props, 'back');
export const moveRight = (selectedCol: string, props: ColumnOperationProps): (() => void) =>
  moveOnePosition(selectedCol, props, 'right');
export const moveLeft = (selectedCol: string, props: ColumnOperationProps): (() => void) =>
  moveOnePosition(selectedCol, props, 'left');
export const updateVisibility = async (dataId: string, visibility: VisibilityState): BaseReturn =>
  await persistVisibility(dataId, { visibility: JSON.stringify(visibility) });
export const toggleVisibility = async (dataId: string, toggle: string): BaseReturn =>
  await persistVisibility(dataId, { toggle });
export const deleteColumn = async (dataId: string, col: string): BaseReturn => await deleteCols(dataId, [col]);
export const deleteColumns = async (dataId: string, cols: string[]): BaseReturn => await deleteCols(dataId, cols);
