import { combineReducers } from "redux";

import { chartData } from "./chart";
import _ from "lodash";

function instances(state = [], action = {}) {
  switch (action.type) {
    case "load-instances":
      return action.instances.data || [];
    default:
      return state;
  }
}

function loading(state = true, action = {}) {
  switch (action.type) {
    case "load-instances":
      return false;
    default:
      return state;
  }
}

function loadingDatasets(state = false, action = {}) {
  switch (action.type) {
    case "loading-datasets":
      return true;
    case "load-instances":
      return false;
    default:
      return state;
  }
}

function loadingError(state = null, action = {}) {
  switch (action.type) {
    case "clear-errors":
      return null;
    case "load-instances":
      return action.instances.error ? action.instances : null;
    default:
      return state;
  }
}

function loadingMerge(state = false, action = {}) {
  switch (action.type) {
    case "load-merge":
      return true;
    case "load-merge-error":
    case "load-merge-data":
      return false;
    default:
      return state;
  }
}

function mergeError(state = null, action = {}) {
  switch (action.type) {
    case "load-merge":
    case "load-merge-data":
    case "clear-errors":
      return null;
    case "load-merge-error":
      return action.error || null;
    default:
      return state;
  }
}

function action(state = "merge", action = {}) {
  switch (action.type) {
    case "update-action-type":
      return action.action;
    default:
      return state;
  }
}

const mergeReducers = combineReducers({
  how: (state = "inner", action = {}) => (action.prop === "how" ? action.value : state),
  sort: (state = false, action = {}) => (action.prop === "sort" ? action.value : state),
  indicator: (state = false, action = {}) => (action.prop === "indicator" ? action.value : state),
});

const stackReducers = combineReducers({
  ignoreIndex: (state = false, action = {}) => (action.prop === "ignoreIndex" ? action.value : state),
});

function mergeConfig(state = {}, action = {}) {
  if ((action.type === "update-action-config" && action.action === "merge") || action.type === "init-params") {
    return mergeReducers(state, action);
  }
  return state;
}

function stackConfig(state = {}, action = {}) {
  if ((action.type === "update-action-config" && action.action === "stack") || action.type === "init-params") {
    return stackReducers(state, action);
  }
  return state;
}

const datasetReducers = combineReducers({
  dataId: (state = null, action = {}) => (action.prop === "dataId" ? action.value : state),
  index: (state = null, action = {}) => (action.prop === "index" ? action.value : state),
  columns: (state = null, action = {}) => (action.prop === "columns" ? action.value : state),
  suffix: (state = null, action = {}) => (action.prop === "suffix" ? action.value : state),
  isOpen: (state = true, action = {}) => (action.prop === "isOpen" ? action.value : state),
  isDataOpen: (state = false, action = {}) => (action.prop === "isDataOpen" ? action.value : state),
});

function datasets(state = [], action = {}) {
  switch (action.type) {
    case "add-dataset":
      return [
        ..._.map(state, d => ({ ...d, isOpen: false })),
        datasetReducers({}, { prop: "dataId", value: action.dataId }),
      ];
    case "remove-dataset":
      return _.map(
        _.reject(state, (_, i) => i === action.index),
        (d, i) => ({ ...d, isOpen: i === state.length - 2 })
      );
    case "toggle-dataset":
      return _.map(state, (d, i) => (i === action.index ? { ...d, isOpen: !d.isOpen } : d));
    case "update-dataset":
      return _.map(state, (d, i) => (i === action.index ? datasetReducers(d, action) : d));
    default:
      return state;
  }
}

function showCode(state = true, action = {}) {
  switch (action.type) {
    case "load-merge-data":
      return false;
    case "clear-merge-data":
      return true;
    case "toggle-show-code":
      return !state;
    default:
      return state;
  }
}

function mergeDataId(state = null, action = {}) {
  switch (action.type) {
    case "load-merge-data":
      return action.dataId + "";
    case "clear-merge-data":
      return null;
    default:
      return state;
  }
}

export default combineReducers({
  chartData,
  instances,
  loading,
  loadingDatasets,
  loadingError,
  loadingMerge,
  mergeError,
  action,
  mergeConfig,
  stackConfig,
  datasets,
  showCode,
  mergeDataId,
});
