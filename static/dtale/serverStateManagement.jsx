import $ from "jquery";
import _ from "lodash";

import { buildURLString } from "../actions/url-utils";
import { fetchJson, fetchJsonPromise, logException } from "../fetcher";
import menuFuncs from "./menu/dataViewerMenuUtils";

function buildCallback(route, dataId, params) {
  return () => fetchJson(buildURLString(`/dtale/${route}/${dataId}?`, params), _.noop);
}

function moveOnePosition(selectedCol, { columns, propagateState, dataId }, action) {
  return () => {
    const locked = _.filter(columns, "locked");
    const nonLocked = _.filter(columns, ({ locked }) => !locked);
    const selectedIdx = _.findIndex(nonLocked, { name: selectedCol });
    if (action === "right" && selectedIdx === nonLocked.length - 1) {
      return;
    }
    if (action === "left" && selectedIdx === 0) {
      return;
    }
    const moveToRightIdx = action === "right" ? selectedIdx : selectedIdx - 1;
    const moveToRight = _.clone(nonLocked[moveToRightIdx]);
    const moveToLeftIdx = action === "right" ? selectedIdx + 1 : selectedIdx;
    const moveToLeft = _.clone(nonLocked[moveToLeftIdx]);
    nonLocked[moveToRightIdx] = moveToLeft;
    nonLocked[moveToLeftIdx] = moveToRight;
    const finalCols = _.concat(locked, nonLocked);
    const callback = buildCallback("update-column-position", dataId, {
      col: selectedCol,
      action,
    });
    propagateState({ columns: finalCols, triggerResize: true }, callback);
  };
}

function moveTo(selectedCol, { columns, propagateState, dataId }, action = "front") {
  return () => {
    const locked = _.filter(columns, "locked");
    const colsToMove = _.filter(columns, ({ name, locked }) => selectedCol === name && !locked);
    let finalCols = _.filter(columns, ({ name }) => selectedCol !== name);
    finalCols = _.filter(finalCols, ({ name }) => !_.find(locked, { name }));
    finalCols = action === "front" ? _.concat(locked, colsToMove, finalCols) : _.concat(locked, finalCols, colsToMove);
    const callback = buildCallback("update-column-position", dataId, {
      col: selectedCol,
      action,
    });
    propagateState({ columns: finalCols, triggerResize: true }, callback);
  };
}

function lockCols(selectedCols, { columns, propagateState, dataId }) {
  return () => {
    let locked = _.filter(columns, "locked");
    locked = _.concat(
      locked,
      _.map(
        _.filter(columns, ({ name }) => _.includes(selectedCols, name)),
        c => _.assignIn({}, c, { locked: true })
      )
    );
    const callback = buildCallback("update-locked", dataId, {
      col: selectedCols[0],
      action: "lock",
    });
    propagateState(
      {
        columns: _.concat(
          locked,
          _.filter(columns, ({ name }) => !_.find(locked, { name }))
        ),
        fixedColumnCount: locked.length,
        selectedCols: [],
        triggerResize: true,
      },
      callback
    );
  };
}

function unlockCols(selectedCols, { columns, propagateState, dataId }) {
  return () => {
    let locked = _.filter(columns, "locked");
    const unlocked = _.map(
      _.filter(locked, ({ name }) => _.includes(selectedCols, name)),
      c => _.assignIn({}, c, { locked: false })
    );
    locked = _.filter(locked, ({ name }) => !_.includes(selectedCols, name));
    const callback = buildCallback("update-locked", dataId, {
      col: selectedCols[0],
      action: "unlock",
    });
    propagateState(
      {
        columns: _.concat(
          locked,
          unlocked,
          _.filter(columns, c => !_.get(c, "locked", false))
        ),
        fixedColumnCount: locked.length,
        selectedCols: [],
        triggerResize: true,
      },
      callback
    );
  };
}

function persistVisibility(dataId, params, callback) {
  try {
    $.post(menuFuncs.fullPath("/dtale/update-visibility", dataId), params, callback);
  } catch (e) {
    logException(e, e.stack);
  }
}

function updateSettings(settings, dataId, callback = _.noop) {
  fetchJsonPromise(
    buildURLString(`/dtale/update-settings/${dataId}?`, {
      settings: JSON.stringify(settings),
    })
  )
    .then(callback)
    .catch((e, callstack) => {
      logException(e, callstack);
    });
}

function dropFilteredRows(dataId, callback = _.noop) {
  fetchJsonPromise(buildURLString(`/dtale/drop-filtered-rows/${dataId}`))
    .then(callback)
    .catch((e, callstack) => {
      logException(e, callstack);
    });
}

function moveFiltersToCustom(dataId, callback) {
  fetchJson(`/dtale/move-filters-to-custom/${dataId}`, callback);
}

function renameColumn(dataId, col, rename, callback) {
  fetchJson(buildURLString(`/dtale/rename-col/${dataId}`, { col, rename }), callback);
}

function updateFormats(dataId, col, format, all, nanDisplay, callback = _.noop) {
  fetchJson(
    buildURLString(`/dtale/update-formats/${dataId}`, {
      col,
      format: JSON.stringify(format),
      all,
      nanDisplay,
    }),
    callback
  );
}

function saveRangeHighlights(dataId, ranges, callback) {
  try {
    $.post(menuFuncs.fullPath("/dtale/save-range-highlights", dataId), { ranges: JSON.stringify(ranges) }, callback);
  } catch (e) {
    logException(e, e.stack);
  }
}

function editCell(dataId, col, rowIndex, updated, callback) {
  fetchJson(
    buildURLString(`/dtale/edit-cell/${dataId}`, {
      col,
      rowIndex,
      updated,
    }),
    callback
  );
}

function updateTheme(theme, callback) {
  fetchJson(buildURLString("/dtale/update-theme", { theme }), callback);
}

function updateQueryEngine(engine, callback) {
  fetchJson(buildURLString("/dtale/update-query-engine", { engine }), callback);
}

function updatePinMenu(pinned, callback) {
  fetchJson(buildURLString("/dtale/update-pin-menu", { pinned }), callback);
}

function updateLanguage(language, callback) {
  fetchJson(buildURLString("/dtale/update-language", { language }), callback);
}

function updateMaxColumnWidth(width, callback) {
  fetchJson(buildURLString("/dtale/update-maximum-column-width", { width }), callback);
}

function updateMaxRowHeight(height, callback) {
  fetchJson(buildURLString("/dtale/update-maximum-row-height", { height }), callback);
}

function loadFilteredRanges(dataId, callback) {
  fetchJsonPromise(buildURLString(`/dtale/load-filtered-ranges/${dataId}`))
    .then(callback)
    .catch((e, callstack) => {
      logException(e, callstack);
    });
}

function deleteCols(dataId, cols) {
  fetchJson(
    buildURLString(`/dtale/delete-col/${dataId}`, {
      cols: JSON.stringify(cols),
    }),
    _.noop
  );
}

export default {
  moveToFront: (selectedCol, props) => moveTo(selectedCol, props, "front"),
  moveToBack: (selectedCol, props) => moveTo(selectedCol, props, "back"),
  moveRight: (selectedCol, props) => moveOnePosition(selectedCol, props, "right"),
  moveLeft: (selectedCol, props) => moveOnePosition(selectedCol, props, "left"),
  lockCols,
  unlockCols,
  updateVisibility: (dataId, visibility, callback) =>
    persistVisibility(dataId, { visibility: JSON.stringify(visibility) }, callback),
  toggleVisibility: (dataId, toggle, callback) => persistVisibility(dataId, { toggle }, callback),
  updateSettings,
  deleteColumn: (dataId, col) => () => deleteCols(dataId, [col]),
  deleteColumns: (dataId, cols) => () => deleteCols(dataId, cols),
  renameColumn,
  updateFormats,
  editCell,
  updateTheme,
  updateQueryEngine,
  updatePinMenu,
  updateLanguage,
  updateMaxColumnWidth,
  updateMaxRowHeight,
  loadFilteredRanges,
  dropFilteredRows,
  moveFiltersToCustom,
  saveRangeHighlights,
};
