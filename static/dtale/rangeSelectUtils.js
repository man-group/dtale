import _ from "lodash";

export function convertCellIdxToCoords(cellIdx) {
  return _.map(_.split(cellIdx, "|"), v => parseInt(v) - 1);
}

export function buildRanges(cell1, cell2) {
  const [col1, row1] = convertCellIdxToCoords(cell1);
  const [col2, row2] = convertCellIdxToCoords(cell2);
  const colRange = [col1, col2];
  colRange.sort();
  const rowRange = [row1, row2];
  rowRange.sort();
  return { colRange, rowRange };
}

export function isInRange(currCol, currRow, rangeSelect) {
  if (!rangeSelect || !rangeSelect.start || !rangeSelect.end) {
    return false;
  }
  const { colRange, rowRange } = buildRanges(rangeSelect.start, rangeSelect.end);
  const inCols = currCol >= colRange[0] && currCol <= colRange[1];
  const inRows = currRow >= rowRange[0] && currRow <= rowRange[1];
  return inCols && inRows;
}

export function buildCopyText(data, columns, cell1, cell2) {
  const { colRange, rowRange } = buildRanges(cell1, cell2);
  const headers = _.map(
    _.filter(columns, (_, cIdx) => cIdx >= colRange[0] + 1 && cIdx <= colRange[1] + 1),
    "name"
  );
  let text = "";
  let currRow = rowRange[0];
  while (currRow <= rowRange[1]) {
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

export function fireRangeSelection(e, state, propagateState, openChart) {
  // check for range selected
  if (e.shiftKey) {
    const cellIdx = _.get(e, "target.attributes.cell_idx.nodeValue");
    if (cellIdx) {
      const { columns, data, rangeSelect } = state;
      if (rangeSelect) {
        const copyText = buildCopyText(data, columns, rangeSelect.start, cellIdx);
        const title = "Copy Range to Clipboard";
        propagateState({ rangeSelect: { ...rangeSelect, end: cellIdx } });
        openChart({ ...copyText, type: "copy-range", title, size: "modal-sm" });
      } else {
        propagateState({ rangeSelect: { start: cellIdx } });
      }
    }
    return true;
  }
  return false;
}
