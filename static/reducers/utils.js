import _ from "lodash";

export function getHiddenValue(id) {
  const hiddenElem = document.getElementById(id);
  if (hiddenElem) {
    return hiddenElem.value;
  }
  return null;
}

export function toBool(value) {
  return _.lowerCase(value) === "true";
}

export function toJson(value) {
  return value ? JSON.parse(value) : {};
}
