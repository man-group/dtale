import { RangeState } from '../redux/state/AppState';
import * as CopyRangeRepository from '../repository/CopyRangeRepository';

import { ColumnDef, DataViewerData, RangeSelection } from './DataViewerState';
import * as gu from './gridUtils';

const SORT_DESC = (a: number, b: number): number => a - b;

/** Range selection properties */
interface RangeDef {
  colRange: number[];
  rowRange: number[];
}

export const buildRanges = (cell1: string, cell2: string): RangeDef => {
  const [col1, row1] = gu.convertCellIdxToCoords(cell1);
  const [col2, row2] = gu.convertCellIdxToCoords(cell2);
  const colRange = [col1, col2].sort(SORT_DESC);
  const rowRange = [row1, row2].sort(SORT_DESC);
  return { colRange, rowRange };
};

const baseIsInRowColRange = (currCol: number, range: RangeSelection<number>): boolean => {
  const finalRange = [range.start, range.end].sort(SORT_DESC);
  return currCol >= finalRange[0] && currCol <= finalRange[1];
};

export const isInRange = (currCol: number, currRow: number, rangeState: RangeState): boolean => {
  const { rangeSelect, columnRange, rowRange, ctrlRows, ctrlCols, selectedRow } = rangeState;
  if (currRow === selectedRow) {
    return true;
  }
  if (columnRange?.start && columnRange?.end) {
    return baseIsInRowColRange(currCol, columnRange);
  }
  if (rowRange?.start !== undefined && rowRange?.end !== undefined) {
    return baseIsInRowColRange(currRow, rowRange);
  }
  if (ctrlRows?.includes(currRow)) {
    return true;
  }
  if (ctrlCols?.includes(currCol)) {
    return true;
  }
  if (!rangeSelect || !rangeSelect.start || !rangeSelect.end) {
    return false;
  }
  const ranges = buildRanges(rangeSelect.start, rangeSelect.end);
  const inCols = currCol >= ranges.colRange[0] && currCol <= ranges.colRange[1];
  const inRows = currRow >= ranges.rowRange[0] && currRow <= ranges.rowRange[1];
  return inCols && inRows;
};

export const isInRowOrColumnRange = (currCol: number, range: RangeSelection<number> | null): boolean => {
  if (!range || !range.start || !range.end) {
    return false;
  }
  return baseIsInRowColRange(currCol, range);
};

/** Properties for copying text */
export interface CopyText {
  text: string;
  headers: string[];
}

export const buildCopyText = (data: DataViewerData, columns: ColumnDef[], cell1: string, cell2: string): CopyText => {
  const { colRange, rowRange } = buildRanges(cell1, cell2);
  const headers = columns.filter((_, cIdx) => cIdx >= colRange[0] && cIdx <= colRange[1]).map((col) => col.name);
  let text = '';
  let currRow = rowRange[0] - 1;
  while (currRow <= rowRange[1] - 1) {
    const row = data[currRow];
    text += headers.map((col) => row?.[col]?.raw ?? '').join('\t');
    text += '\n';
    currRow++;
  }
  return { text, headers };
};

const buildColumnCopyPost = (columns: ColumnDef[], callback: (text: CopyText) => void, dataId: string): void => {
  const headers = columns.map((col) => col.name);
  CopyRangeRepository.buildCopyColumns(dataId, headers).then((response) => {
    if (response?.success) {
      callback({ text: response.text, headers });
    }
  });
};

export const buildColumnCopyText = (
  dataId: string,
  columns: ColumnDef[],
  start: number,
  end: number,
  callback: (text: CopyText) => void,
): void => {
  const range = [start - 1, end - 1].sort(SORT_DESC);
  const selectedColumns = columns.filter((c) => c.index >= range[0] && c.index <= range[1] && c.visible);
  buildColumnCopyPost(selectedColumns, callback, dataId);
};

export const buildCtrlColumnCopyText = (
  dataId: string,
  columns: ColumnDef[],
  columnIndexes: number[],
  callback: (text: CopyText) => void,
): void => {
  const selectedColumns = columnIndexes.sort(SORT_DESC).map((idx) => columns[idx]);
  buildColumnCopyPost(selectedColumns, callback, dataId);
};

export const buildRowCopyText = (
  dataId: string,
  columns: ColumnDef[],
  params: Record<string, string>,
  callback: (text: CopyText) => void,
): void => {
  const selectedColumns = columns.filter((c) => c.visible && c.name !== gu.IDX);
  const headers = selectedColumns.map((col) => col.name);
  CopyRangeRepository.buildCopyRows(dataId, headers, params).then((response) => {
    if (response?.success) {
      callback({ text: response.text, headers });
    }
  });
};

export const toggleSelection = (selections: number[], val: number): number[] =>
  selections.includes(val) ? selections.filter((s) => s !== val) : [...selections, val];

export const buildRangeState = (currState?: Partial<RangeState>): RangeState => {
  return {
    rowRange: null,
    columnRange: null,
    rangeSelect: null,
    ctrlRows: null,
    ctrlCols: null,
    selectedRow: null,
    ...currState,
  };
};
