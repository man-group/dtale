import _ from "lodash";

function updateSort(selectedCols, dir, { sortInfo, propagateState }) {
  let updatedSortInfo = _.filter(sortInfo, ([col, _dir]) => !_.includes(selectedCols, col));
  switch (dir) {
    case "ASC":
    case "DESC":
      updatedSortInfo = _.concat(
        updatedSortInfo,
        _.map(selectedCols, col => [col, dir])
      );
      break;
    case "NONE":
    default:
      break;
  }
  propagateState({ sortInfo: updatedSortInfo, triggerResize: true });
}

function moveOnePosition(selectedCol, { columns, propagateState }, dir) {
  return () => {
    const locked = _.filter(columns, "locked");
    const nonLocked = _.filter(columns, ({ locked }) => !locked);
    const selectedIdx = _.findIndex(nonLocked, { name: selectedCol });
    if (dir === "right" && selectedIdx === nonLocked.length - 1) {
      return;
    }
    if (dir === "left" && selectedIdx === 0) {
      return;
    }
    const moveToRightIdx = dir === "right" ? selectedIdx : selectedIdx - 1;
    const moveToRight = _.clone(nonLocked[moveToRightIdx]);
    const moveToLeftIdx = dir === "right" ? selectedIdx + 1 : selectedIdx;
    const moveToLeft = _.clone(nonLocked[moveToLeftIdx]);
    nonLocked[moveToRightIdx] = moveToLeft;
    nonLocked[moveToLeftIdx] = moveToRight;
    const finalCols = _.concat(locked, nonLocked);
    propagateState({ columns: finalCols, triggerResize: true });
  };
}

function moveToFront(selectedCol, { columns, propagateState }) {
  return () => {
    const locked = _.filter(columns, "locked");
    const colsToFront = _.filter(columns, ({ name, locked }) => selectedCol === name && !locked);
    let finalCols = _.filter(columns, ({ name }) => selectedCol !== name);
    finalCols = _.filter(finalCols, ({ name }) => !_.find(locked, { name }));
    finalCols = _.concat(locked, colsToFront, finalCols);
    propagateState({ columns: finalCols, triggerResize: true });
  };
}

function lockCols(selectedCols, { columns, propagateState }) {
  return () => {
    let locked = _.filter(columns, "locked");
    locked = _.concat(
      locked,
      _.map(
        _.filter(columns, ({ name }) => _.includes(selectedCols, name)),
        c => _.assignIn({}, c, { locked: true })
      )
    );
    propagateState({
      columns: _.concat(
        locked,
        _.filter(columns, ({ name }) => !_.find(locked, { name }))
      ),
      fixedColumnCount: locked.length,
      selectedCols: [],
      triggerResize: true,
    });
  };
}

function unlockCols(selectedCols, { columns, propagateState }) {
  return () => {
    let locked = _.filter(columns, "locked");
    const unlocked = _.map(
      _.filter(locked, ({ name }) => _.includes(selectedCols, name)),
      c => _.assignIn({}, c, { locked: false })
    );
    locked = _.filter(locked, ({ name }) => !_.includes(selectedCols, name));
    propagateState({
      columns: _.concat(
        locked,
        unlocked,
        _.filter(columns, c => !_.get(c, "locked", false))
      ),
      fixedColumnCount: locked.length,
      selectedCols: [],
      triggerResize: true,
    });
  };
}

function buildStyling(val, colType, styleProps) {
  const style = {};
  if (!_.isUndefined(val) && !_.isEmpty(styleProps)) {
    if (styleProps.redNegs) {
      switch (colType) {
        case "float":
        case "int":
          style.color = val < 0 ? "red" : "";
          break;
      }
    }
  }
  return style;
}

function fullPath(path, dataId = null) {
  return dataId ? `${path}/${dataId}` : path;
}

function open(path, dataId, height = 450, width = 500) {
  window.open(fullPath(path, dataId), "_blank", `titlebar=1,location=1,status=1,width=${width},height=${height}`);
}

function shouldOpenPopup(height, width) {
  if (global.top === global.self) {
    // not within iframe
    return window.innerWidth < width || window.innerHeight < height;
  }
  return true;
}

export default {
  updateSort,
  moveToFront,
  moveRight: (selectedCol, props) => moveOnePosition(selectedCol, props, "right"),
  moveLeft: (selectedCol, props) => moveOnePosition(selectedCol, props, "left"),
  lockCols,
  unlockCols,
  buildStyling,
  fullPath,
  open,
  shouldOpenPopup,
};
