import _ from "lodash";
import $ from "jquery";

import { logException } from "../fetcher";
import * as gu from "./gridUtils";
import menuFuncs from "./menu/dataViewerMenuUtils";

export function buildRanges(cell1, cell2) {
  const [col1, row1] = gu.convertCellIdxToCoords(cell1);
  const [col2, row2] = gu.convertCellIdxToCoords(cell2);
  const colRange = [col1, col2];
  colRange.sort();
  const rowRange = [row1, row2];
  rowRange.sort();
  return { colRange, rowRange };
}

function baseIsInRowColRange(currCol, range) {
  const finalRange = [range.start, range.end];
  finalRange.sort();
  return currCol >= finalRange[0] && currCol <= finalRange[1];
}

export function isInRange(currCol, currRow, { rangeSelect, columnRange, rowRange, ctrlRows, ctrlCols, selectedRow }) {
  if (currRow === selectedRow) {
    return true;
  }
  if (columnRange && columnRange.start && columnRange.end) {
    return baseIsInRowColRange(currCol, columnRange);
  }
  if (rowRange && rowRange.start !== undefined && rowRange.end != undefined) {
    return baseIsInRowColRange(currRow, rowRange);
  }
  if (ctrlRows && _.includes(ctrlRows, currRow)) {
    return true;
  }
  if (ctrlCols && _.includes(ctrlCols, currCol)) {
    return true;
  }
  if (!rangeSelect || !rangeSelect.start || !rangeSelect.end) {
    return false;
  }
  const ranges = buildRanges(rangeSelect.start, rangeSelect.end);
  const inCols = currCol >= ranges.colRange[0] && currCol <= ranges.colRange[1];
  const inRows = currRow >= ranges.rowRange[0] && currRow <= ranges.rowRange[1];
  return inCols && inRows;
}

export function isInRowOrColumnRange(currCol, range) {
  if (!range || !range.start || !range.end) {
    return false;
  }
  return baseIsInRowColRange(currCol, range);
}

export function buildCopyText(data, columns, cell1, cell2) {
  const { colRange, rowRange } = buildRanges(cell1, cell2);
  const headers = _.map(
    _.filter(columns, (_, cIdx) => cIdx >= colRange[0] && cIdx <= colRange[1]),
    "name"
  );
  let text = "";
  let currRow = rowRange[0] - 1;
  while (currRow <= rowRange[1] - 1) {
    const row = data["" + currRow];
    text += _.join(
      _.map(headers, col => _.get(row, [col, "raw"], "")),
      "\t"
    );
    text += "\n";
    currRow++;
  }
  return { text, headers };
}

function buildColumnCopyPost(columns, callback, dataId) {
  const headers = _.map(columns, "name");
  const postCallback = text => callback({ text, headers });
  try {
    $.post(menuFuncs.fullPath("/dtale/build-column-copy", dataId), { columns: JSON.stringify(headers) }, postCallback);
  } catch (e) {
    logException(e, e.stack);
  }
}

export function buildColumnCopyText(dataId, columns, start, end, callback) {
  const range = [start - 1, end - 1];
  range.sort();
  const selectedColumns = _.filter(columns, c => c.index >= range[0] && c.index <= range[1] && c.visible);
  buildColumnCopyPost(selectedColumns, callback, dataId);
}

export function buildCtrlColumnCopyText(dataId, columns, columnIndexes, callback) {
  columnIndexes.sort();
  const selectedColumns = _.map(columnIndexes, idx => columns[idx]);
  buildColumnCopyPost(selectedColumns, callback, dataId);
}

export function buildRowCopyText(dataId, columns, params, callback) {
  const selectedColumns = _.filter(columns, c => c.visible && c.name !== gu.IDX);
  const headers = _.map(selectedColumns, "name");
  const postCallback = text => callback({ text, headers });
  try {
    $.post(
      menuFuncs.fullPath("/dtale/build-row-copy", dataId),
      { columns: JSON.stringify(headers), ...params },
      postCallback
    );
  } catch (e) {
    logException(e, e.stack);
  }
}

export function toggleSelection(selections, val) {
  return _.includes(selections, val) ? _.without(selections, val) : _.concat(selections, val);
}

export function buildRangeState(currState) {
  return {
    rowRange: null,
    columnRange: null,
    rangeSelect: null,
    ctrlRows: null,
    ctrlCols: null,
    selectedRow: null,
    ...currState,
  };
}
