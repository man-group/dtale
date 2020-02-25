import _ from "lodash";

import actions from "../actions/dtale";
import { DataViewerMenu } from "../dtale/DataViewerMenu";

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

const BASE_SETTINGS = "{&quot;sort&quot;:[[&quot;col1&quot;,&quot;ASC&quot;]]}";
const HIDE_SHUTDOWN = "False";
const PROCESSES = 1;
const IFRAME = "False";
const DATA_ID = 1;

function buildInnerHTML(props = {}, store = null) {
  const { settings, hideShutdown, processes, iframe, dataId } = props;
  const pjson = require("../../package.json");
  const body = document.getElementsByTagName("body")[0];
  let innerHTML = `<input type="hidden" id="settings" value="${settings || BASE_SETTINGS}" />`;
  innerHTML += `<input type="hidden" id="version" value="${pjson.version}" />`;
  innerHTML += `<input type="hidden" id="hide_shutdown" value="${hideShutdown || HIDE_SHUTDOWN}" />`;
  innerHTML += `<input type="hidden" id="processes" value=${processes || PROCESSES} />`;
  innerHTML += `<input type="hidden" id="iframe" value="${iframe || IFRAME}" />`;
  innerHTML += `<input type="hidden" id="data_id" value="${dataId || DATA_ID}" />`;
  innerHTML += `<div id="content" style="height: 1000px;width: 1000px;" ></div>`;
  innerHTML += `<span id="code-title" />`;
  body.innerHTML = innerHTML;

  if (store) {
    store.dispatch(actions.init());
  }
}

function findMainMenuButton(result, name, btnTag = "button") {
  return result
    .find(DataViewerMenu)
    .find(`ul li ${btnTag}`)
    .findWhere(b => _.includes(b.text(), name))
    .first();
}

function clickMainMenuButton(result, name, btnTag = "button") {
  return findMainMenuButton(result, name, btnTag).simulate("click");
}

export {
  withGlobalJquery,
  replaceNBSP,
  timeoutChain,
  logException,
  buildInnerHTML,
  findMainMenuButton,
  clickMainMenuButton,
};
