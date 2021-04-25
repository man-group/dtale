import { getHiddenValue, toBool } from "./utils";

export function auth(state = false, action = {}) {
  switch (action.type) {
    case "init-params":
      return toBool(getHiddenValue("auth"));
    default:
      return state;
  }
}

export function username(state = null, action = {}) {
  switch (action.type) {
    case "init-params":
      return getHiddenValue("username");
    default:
      return state;
  }
}
