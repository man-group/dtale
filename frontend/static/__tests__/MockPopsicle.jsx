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
export default function mockPopsicle(getReturnValue) {
  // Return an object with all the same keys as `popsicle`, but a
  // different value for the `get` key.

  const get = (url) => {
    const p = new Promise((fullfill) => {
      const { urlFetcher } = require('./redux-test-utils').default;
      let body = getReturnValue?.(url);
      if (body === undefined) {
        body = urlFetcher(url);
      }
      fullfill({ data: body });
    });

    p.use = () => p;

    return p;
  };
  jest.mock('axios', () => ({
    __esModule: true,
    default: {
      get,
      post: jest.fn(),
    },
  }));
}
