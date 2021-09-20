import _ from "lodash";

function withGlobalJquery(callback) {
  global.jQuery = jest.requireActual("jquery");
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

function buildHidden(id, value) {
  return `<input type="hidden" id="${id}" value="${value}" />`;
}

const BASE_HTML = `
<div id="content" style="height: 1000px;width: 1000px;" />
<div id="popup-content" />
<span id="code-title" />
`;

// eslint-disable-next-line complexity
function buildInnerHTML(props = {}, store = null) {
  const actions = require("../actions/dtale");
  const pjson = require("../../package.json");
  const body = document.getElementsByTagName("body")[0];
  body.innerHTML = [
    buildHidden("settings", props.settings ?? BASE_SETTINGS),
    buildHidden("version", pjson.version),
    buildHidden("python_version", props.pythonVersion ?? "3.8.0"),
    buildHidden("hide_shutdown", props.hideShutdown ?? HIDE_SHUTDOWN),
    buildHidden("hide_drop_rows", props.hideDropRows ?? "False"),
    buildHidden("processes", props.processes ?? PROCESSES),
    buildHidden("iframe", props.iframe ?? IFRAME),
    buildHidden("data_id", props.dataId ?? DATA_ID),
    buildHidden("xarray", props.xarray ?? "False"),
    buildHidden("xarray_dim", props.xarrayDim ?? "{}"),
    buildHidden("allow_cell_edits", props.allowCellEdits ?? "True"),
    buildHidden("is_vscode", props.isVSCode ?? "False"),
    buildHidden("theme", props.theme ?? "light"),
    buildHidden("language", props.language ?? "en"),
    buildHidden("pin_menu", props.pinMenu ?? "False"),
    buildHidden("filtered_ranges", props.filteredRanges ?? JSON.stringify({})),
    buildHidden("auth", props.auth ?? "False"),
    buildHidden("username", props.username ?? ""),
    buildHidden("predefined_filters", props.predefinedFilters ?? "[]"),
    buildHidden("max_column_width", props.maxColumnWidth ?? "None"),
    buildHidden("main_title", props.mainTitle ?? ""),
    buildHidden("main_title_font", props.mainTitleFont ?? ""),
    buildHidden("query_engine", props.queryEngine ?? "python"),
    BASE_HTML,
  ];
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
  const keySegs = key.split(":");
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
