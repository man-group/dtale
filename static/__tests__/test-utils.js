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

const BASE_SETTINGS = "{&quot;sortInfo&quot;:[[&quot;col1&quot;,&quot;ASC&quot;]],&quot;precision&quot;:2}";
const HIDE_SHUTDOWN = "False";
const PROCESSES = 1;
const IFRAME = "False";
const DATA_ID = 1;
export const PREDEFINED_FILTERS = _.join(
  [
    "[{",
    "&quot;name&quot;:&quot;custom_foo&quot;,",
    "&quot;column&quot;:&quot;foo&quot;,",
    "&quot;description&quot;:&quot;foo&quot;,",
    "&quot;inputType&quot;: &quot;input&quot;",
    "}]",
  ],
  ""
);

function buildInnerHTML(props = {}, store = null) {
  const actions = require("../actions/dtale").default;
  const { settings, hideShutdown, processes, iframe, dataId, xarray, xarrayDim, allowCellEdits, theme } = props;
  const { language, pinMenu, filteredRanges, auth, username, predefinedFilters, maxColumnWidth } = props;
  const pjson = require("../../package.json");
  const body = document.getElementsByTagName("body")[0];
  body.innerHTML = [
    `<input type="hidden" id="settings" value="${settings ?? BASE_SETTINGS}" />`,
    `<input type="hidden" id="version" value="${pjson.version}" />`,
    `<input type="hidden" id="python_version" value="${props.pythonVersion ?? "3.8.0"}" />`,
    `<input type="hidden" id="hide_shutdown" value="${hideShutdown ?? HIDE_SHUTDOWN}" />`,
    `<input type="hidden" id="processes" value=${processes ?? PROCESSES} />`,
    `<input type="hidden" id="iframe" value="${iframe ?? IFRAME}" />`,
    `<input type="hidden" id="data_id" value="${dataId ?? DATA_ID}" />`,
    `<input type="hidden" id="xarray" value="${xarray ?? "False"}" />`,
    `<input type="hidden" id="xarray_dim" value="${xarrayDim ?? "{}"}" />`,
    `<input type="hidden" id="allow_cell_edits" value="${allowCellEdits ?? "True"}" />`,
    `<input type="hidden" id="theme" value="${theme ?? "light"}" />`,
    `<input type="hidden" id="language" value="${language ?? "en"}" />`,
    `<input type="hidden" id="pin_menu" value="${pinMenu ?? "False"}" />`,
    `<input type="hidden" id="filtered_ranges" value="${filteredRanges ?? JSON.stringify({})}" />`,
    `<input type="hidden" id="auth" value="${auth ?? "False"}" />`,
    `<input type="hidden" id="username" value="${username ?? ""}" />`,
    `<input type="hidden" id="predefined_filters" value="${predefinedFilters ?? "[]"}" />`,
    `<input type="hidden" id="max_column_width" value=${maxColumnWidth ?? "None"} />`,
    `<div id="content" style="height: 1000px;width: 1000px;" ></div>`,
    `<div id="popup-content"></div>`,
    `<span id="code-title" />`,
  ].join("");
  if (store) {
    store.dispatch(actions.init());
  }
}

function findMainMenuButton(result, name, btnTag = "button") {
  const DataViewerMenu = require("../dtale/menu/DataViewerMenu").DataViewerMenu;
  return result
    .find(DataViewerMenu)
    .find(`ul li ${btnTag}`)
    .findWhere(b => _.includes(b.text(), name))
    .first();
}

function clickMainMenuButton(result, name, btnTag = "button") {
  return findMainMenuButton(result, name, btnTag).simulate("click");
}

function tick(timeout = 0) {
  return new Promise(resolve => {
    setTimeout(resolve, timeout);
  });
}

async function tickUpdate(result, timeout = 0) {
  await tick(timeout);
  result.update();
}

function mockChartJS() {
  jest.mock("chart.js", () => {
    class MockChart {
      constructor(ctx, cfg) {
        this.ctx = ctx;
        this.cfg = cfg;
        this.config = { _config: cfg };
        this.data = cfg.data;
        this.destroyed = false;
        this.options = { scales: { x: {}, y: {} } };
      }
      destroy() {
        this.destroyed = true;
      }
      getElementsAtEventForMode(_evt) {
        return [{ datasetIndex: 0, index: 0, _chart: { config: { _config: this.cfg }, data: this.cfg.data } }];
      }
      getDatasetMeta(_idx) {
        return { controller: { _config: { selectedPoint: 0 } } };
      }
      update() {}
    }
    MockChart.register = () => undefined;
    return {
      Chart: MockChart,
    };
  });
}

function mockD3Cloud() {
  const mocker = withGlobalJquery(() => () => {
    const cloudCfg = {};
    const propUpdate = prop => val => {
      cloudCfg[prop] = val;
      return cloudCfg;
    };
    cloudCfg.size = propUpdate("size");
    cloudCfg.padding = propUpdate("padding");
    cloudCfg.words = propUpdate("words");
    cloudCfg.rotate = propUpdate("rotate");
    cloudCfg.spiral = propUpdate("spiral");
    cloudCfg.random = propUpdate("random");
    cloudCfg.text = propUpdate("text");
    cloudCfg.font = propUpdate("font");
    cloudCfg.fontStyle = propUpdate("fontStyle");
    cloudCfg.fontWeight = propUpdate("fontWeight");
    cloudCfg.fontSize = () => ({
      on: () => ({ start: _.noop }),
    });
    return cloudCfg;
  });
  jest.mock("d3-cloud", () => mocker);
}

function mockWordcloud() {
  jest.mock("react-wordcloud", () => {
    const MockComponent = require("./MockComponent").MockComponent;
    return MockComponent;
  });
}

const mockT = key => {
  const keySegs = _.split(key, ":");
  if (keySegs.length > 2) {
    return _.join(_.tail(keySegs), ":");
  } else if (keySegs.length == 2) {
    return _.last(keySegs);
  }
  return key;
};

export {
  withGlobalJquery,
  replaceNBSP,
  logException,
  buildInnerHTML,
  findMainMenuButton,
  clickMainMenuButton,
  tick,
  tickUpdate,
  mockChartJS,
  mockD3Cloud,
  mockWordcloud,
  mockT,
};
