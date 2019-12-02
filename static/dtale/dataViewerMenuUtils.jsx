import _ from "lodash";

function updateSort(selectedCols, dir, { sortInfo, propagateState }) {
  let updatedSortInfo = _.filter(sortInfo, ([col, _dir]) => !_.includes(selectedCols, col));
  switch (dir) {
    case "ASC":
    case "DESC":
      updatedSortInfo = _.concat(updatedSortInfo, _.map(selectedCols, col => [col, dir]));
      break;
    case "NONE":
    default:
      break;
  }
  propagateState({ sortInfo: updatedSortInfo, triggerResize: true });
}

function moveToFront(selectedCols, { columns, propagateState }) {
  return () => {
    const locked = _.filter(columns, "locked");
    const colsToFront = _.filter(columns, ({ name, locked }) => _.includes(selectedCols, name) && !locked);
    let finalCols = _.filter(columns, ({ name }) => !_.includes(selectedCols, name));
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
      _.map(_.filter(columns, ({ name }) => _.includes(selectedCols, name)), c => _.assignIn({}, c, { locked: true }))
    );
    propagateState({
      columns: _.concat(locked, _.filter(columns, ({ name }) => !_.find(locked, { name }))),
      fixedColumnCount: locked.length,
      selectedCols: [],
      triggerResize: true,
    });
  };
}

function unlockCols(selectedCols, { columns, propagateState }) {
  return () => {
    let locked = _.filter(columns, "locked");
    const unlocked = _.map(_.filter(locked, ({ name }) => _.includes(selectedCols, name)), c =>
      _.assignIn({}, c, { locked: false })
    );
    locked = _.filter(locked, ({ name }) => !_.includes(selectedCols, name));
    propagateState({
      columns: _.concat(locked, unlocked, _.filter(columns, c => !_.get(c, "locked", false))),
      fixedColumnCount: locked.length,
      selectedCols: [],
      triggerResize: true,
    });
  };
}

export { updateSort, moveToFront, lockCols, unlockCols };
