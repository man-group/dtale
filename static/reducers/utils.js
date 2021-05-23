import _ from "lodash";

export function getHiddenValue(id) {
  const hiddenElem = document.getElementById(id);
  if (hiddenElem) {
    if (hiddenElem.value === "None") {
      return null;
    }
    return hiddenElem.value;
  }
  return null;
}

export function toBool(value) {
  return _.lowerCase(value) === "true";
}

export function toFloat(value, returnNull = false) {
  if (value === null && returnNull) {
    return null;
  }
  const parsedVal = parseFloat(value);
  if (parsedVal) {
    return parsedVal;
  }
  return 0.0;
}

export function toJson(value) {
  return value ? JSON.parse(value) : {};
}
