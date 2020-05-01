import * as popsicle from "popsicle";

import { cleanupEndpoint } from "./actions/url-utils";

function logException(e, callStack) {
  console.error(`${e.name}: ${e.message} (${e.fileName}:${e.lineNumber})`);
  console.error(e.stack);
  console.error(callStack);
}

// Useful for libraries that want a Promise.
function fetchJsonPromise(url) {
  const webRoot = window.resourceBaseUrl;
  if (webRoot) {
    url = cleanupEndpoint(`${webRoot}/${url}`);
  }
  return popsicle.fetch(url).then(response => response.json());
}

// Load JSON from `url`, then call `callback` with the JSON-decoded
// result. Most of the time, this is the function you'll want.
function fetchJson(url, callback) {
  const callStack = new Error().stack;
  fetchJsonPromise(url)
    .then(result => {
      callback(result);
    })
    .catch(e => logException(e, callStack));
}

export { logException, fetchJsonPromise, fetchJson };
