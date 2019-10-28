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

function buildInnerHTML(
  settings = "{&quot;sort&quot;:[[&quot;col1&quot;,&quot;ASC&quot;]]}",
  hideShutdown = "False",
  processes = 1
) {
  const pjson = require("../../package.json");
  const body = document.getElementsByTagName("body")[0];
  let innerHTML = `<input type="hidden" id="settings" value="${settings}" />`;
  innerHTML += `<input type="hidden" id="version" value="${pjson.version}" />`;
  innerHTML += `<input type="hidden" id="hide_shutdown" value="${hideShutdown}" />`;
  innerHTML += `<input type="hidden" id="processes" value=${processes} />`;
  innerHTML += `<div id="content" style="height: 1000px;width: 1000px;" ></div>`;
  body.innerHTML = innerHTML;
}

export { withGlobalJquery, replaceNBSP, timeoutChain, logException, buildInnerHTML };
