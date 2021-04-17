import _ from "lodash";

export function colUp(state) {
  const { dtypes, selected } = state;
  if (selected.index < _.size(dtypes) - 1) {
    return _.find(dtypes, { index: selected.index + 1 });
  }
  return selected;
}

export function colDown(state) {
  const { dtypes, selected } = state;
  if (selected.index > 0) {
    return _.find(dtypes, { index: selected.index - 1 });
  }
  return selected;
}
