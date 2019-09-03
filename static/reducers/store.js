import { applyMiddleware, createStore as createReduxStore } from "redux";
import thunk from "redux-thunk";

function createStore(app) {
  return createReduxStore(app, applyMiddleware(thunk));
}

export { createStore };
