function ok(value, _msg) {
  expect(value).toBeTruthy();
}

function notOk(value, _msg) {
  expect(value).toBeFalsy();
}

function equal(actual, expected, _msg) {
  expect(actual).toBe(expected);
}

function deepEqual(actual, expected, _msg) {
  expect(actual).toEqual(expected);
}

export { ok, notOk, equal, deepEqual };
