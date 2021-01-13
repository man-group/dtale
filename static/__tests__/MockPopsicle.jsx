import _ from "lodash";

/**
 * Return an object that behaves the same as popsicle, but overrides
 * `.get`.
 *
 * `getReturnValue` is a simple value, or a function that takes an URL and returns the
 * expected JSON for that URL.
 *
 * Examples:
 *
 * // Always return the same JSON
 * mock({foo: 1, bar: 2});
 *
 * // Return different JSON for different URLs
 * mock(url => {
 *   if (url == '/user') {
 *     return {name: 'Bob};
 *   } else {
 *     return {foo: 'bar'};
 *   }});
 *
 */
function mock(getReturnValue) {
  // Return an object with all the same keys as `popsicle`, but a
  // different value for the `get` key.

  const boomshaka = url => {
    const p = new Promise(fullfill => {
      let body;
      if (_.isFunction(getReturnValue)) {
        body = getReturnValue(url);
      } else {
        body = getReturnValue;
      }
      fullfill({ json: () => body });
    });

    p.use = () => p;

    return p;
  };
  return {
    fetch: boomshaka,
  };
}

export default {
  mock,
};
