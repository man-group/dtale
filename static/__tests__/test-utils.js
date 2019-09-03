import _ from "lodash";

function withGlobalJquery(callback) {
  global.jQuery = require("jquery");
  const results = callback();
  delete global.jQuery;
  return results;
}

function replaceNBSP(text) {
  return text.replace(/\s/g, " ");
}

function logException(e) {
  console.error(`${e.name}: ${e.message} (${e.fileName}:${e.lineNumber})`);
  console.error(e.stack);
}

function timeoutChain(tests, result, done) {
  try {
    if (tests.length) {
      const [pre, post] = _.head(tests);
      pre(result);
      setTimeout(() => {
        result.update();
        post(result);
        timeoutChain(_.tail(tests), result, done);
      }, 400);
    } else {
      done();
    }
  } catch (err) {
    logException(err);
    done();
  }
}

export { withGlobalJquery, replaceNBSP, timeoutChain, logException };
