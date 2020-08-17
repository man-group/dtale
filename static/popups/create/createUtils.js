import _ from "lodash";

export const TYPES = _.concat(
  ["numeric", "bins", "datetime", "random", "type_conversion", "transform", "winsorize", "zscore_normalize"],
  []
);
export const LABELS = { zscore_normalize: "Z-Score Normalize" };

export function buildLabel(v) {
  if (_.has(LABELS, v)) {
    return LABELS[v];
  }
  return _.join(_.map(_.split(v, "_"), _.capitalize), " ");
}

export const BASE_STATE = {
  type: "numeric",
  saveAs: "new",
  name: null,
  cfg: null,
  code: {},
  loadingColumns: true,
  loadingColumn: false,
  namePopulated: false,
};
