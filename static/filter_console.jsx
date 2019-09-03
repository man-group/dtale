const originalConsoleError = console.error;
let patterns = [];

// Patch console.error to ignore all errors that match the pattern
// given.
//
// Usually, you will to call this only on dev builds:
//
//     if (process.env.NODE_ENV == "dev") {
//       ignoreConsoleErrors(/foo/);
//     }
//
// This ensures that we don't filter any errors in production (helping
// debugging and performance). React doesn't throw any warnings in
// production builds anyway.
function ignoreConsoleErrors(pattern) {
  patterns.push(pattern);

  // If we haven't patched console.error, patch it. This ensures that
  // users can call this function multiple times.
  if (originalConsoleError == console.error) {
    console.error = function(...args) {
      let message = null;
      // eslint-disable-next-line lodash/prefer-lodash-typecheck
      if (typeof args[0] === "string") {
        message = args[0];
      }

      // Skip the message if it matches.
      let shouldIgnore = false;
      patterns.forEach(pattern => {
        if (message && message.match(pattern)) {
          shouldIgnore = true;
        }
      });

      if (!shouldIgnore) {
        // Otherwise, continue to console.error as normal.
        originalConsoleError.apply(console, args);
      }
    };
  }
}

// Work around https://github.com/adazzle/react-data-grid/issues/418
function ignoreDatagridWarnings() {
  const prefixes = [
    "Warning: Failed prop type: The prop `isScrolling` is marked as required ",
    "Warning: Failed prop type: Required prop ",
    "Warning: Failed prop type: Invalid prop `value` supplied to `Cell`.",
    "Warning: getDefaultProps is only used on classic React.createClass definitions.",
    "Warning: Failed prop type: You provided a `checked` prop to a form field without an `onChange` handler.",
  ];
  prefixes.forEach(prefix => {
    const pattern = new RegExp(`^${prefix}[\\s\\S]*created by (ReactDataGrid|ReactNodeGrid|ReactAtlasNodeGrid)`);
    ignoreConsoleErrors(pattern);
  });
  ignoreConsoleErrors(/^Warning: Cell: `ref` is not a prop./);
  ignoreConsoleErrors(/^Warning: Invalid argument supplied to oneOf, expected an instance of array./);
  ignoreConsoleErrors(/^Warning: `NaN` is an invalid value for the `width` css style property./);
  ignoreConsoleErrors(/Warning: getDefaultProps is only used on classic React.createClass definitions./);
  ignoreConsoleErrors(/Warning: Failed prop type: You provided a `checked` prop to a form field/);
}

function restoreConsoleError() {
  console.error = originalConsoleError;
  patterns = [];
}

export default { ignoreDatagridWarnings, ignoreConsoleErrors, restoreConsoleError };
