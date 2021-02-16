import _ from "lodash";
import $ from "jquery";

import { fetchJson } from "../fetcher";
import menuFuncs from "../dtale/menu/dataViewerMenuUtils";
import { buildURLString } from "./url-utils";

const loadProcesses = dispatch =>
  fetchJson("/dtale/processes?dtypes=true", data => dispatch({ type: "load-instances", instances: data }));

function init() {
  return dispatch => {
    dispatch({ type: "init-params" });
    loadProcesses(dispatch);
  };
}

function loadDatasets() {
  return dispatch => {
    dispatch({ type: "loading-datasets" });
    loadProcesses(dispatch);
  };
}

function updateActionType(action) {
  return dispatch => dispatch({ type: "update-action-type", action });
}

function updateActionConfig(actionUpdates) {
  return dispatch => dispatch({ type: "update-action-config", ...actionUpdates });
}

function extractDatasetParams(datasets) {
  return JSON.stringify(
    _.map(datasets, dataset => ({
      columns: _.map(dataset.columns, "name"),
      index: _.map(dataset.index, "name"),
      dataId: dataset.dataId,
      suffix: dataset.suffix,
    }))
  );
}

function buildMerge(name) {
  return (dispatch, getState) => {
    dispatch({ type: "load-merge" });
    const { action, mergeConfig, stackConfig, datasets } = getState();
    const handleResponse = data => {
      if (data.success) {
        dispatch({ type: "load-merge-data", dataId: data.data_id });
        return;
      }
      dispatch({ type: "load-merge-error", error: data });
    };
    const config = action === "merge" ? mergeConfig : stackConfig;
    $.post(
      menuFuncs.fullPath("/dtale/merge"),
      { action, config: JSON.stringify(config), datasets: extractDatasetParams(datasets), name },
      handleResponse
    );
  };
}

function clearMerge() {
  return (dispatch, getState) => {
    const { mergeDataId } = getState();
    fetchJson(buildURLString("/dtale/cleanup-datasets", { dataIds: mergeDataId }), () => {
      dispatch({ type: "clear-merge-data" });
    });
  };
}

export default { init, loadDatasets, updateActionType, updateActionConfig, buildMerge, clearMerge };
