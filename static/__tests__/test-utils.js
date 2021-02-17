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

const BASE_SETTINGS = "{&quot;sort&quot;:[[&quot;col1&quot;,&quot;ASC&quot;]],&quot;precision&quot;:2}";
const HIDE_SHUTDOWN = "False";
const PROCESSES = 1;
const IFRAME = "False";
const DATA_ID = 1;

function buildInnerHTML(props = {}, store = null) {
  const actions = require("../actions/dtale").default;
  const { settings, hideShutdown, processes, iframe, dataId, xarray, xarrayDim, allowCellEdits, theme } = props;
  const { language, pinMenu, filteredRanges } = props;
  const pjson = require("../../package.json");
  const body = document.getElementsByTagName("body")[0];
  let innerHTML = `<input type="hidden" id="settings" value="${settings ?? BASE_SETTINGS}" />`;
  innerHTML += `<input type="hidden" id="version" value="${pjson.version}" />`;
  innerHTML += `<input type="hidden" id="python_version" value="${props.pythonVersion ?? "3.8.0"}" />`;
  innerHTML += `<input type="hidden" id="hide_shutdown" value="${hideShutdown ?? HIDE_SHUTDOWN}" />`;
  innerHTML += `<input type="hidden" id="processes" value=${processes ?? PROCESSES} />`;
  innerHTML += `<input type="hidden" id="iframe" value="${iframe ?? IFRAME}" />`;
  innerHTML += `<input type="hidden" id="data_id" value="${dataId ?? DATA_ID}" />`;
  innerHTML += `<input type="hidden" id="xarray" value="${xarray ?? "False"}" />`;
  innerHTML += `<input type="hidden" id="xarray_dim" value="${xarrayDim ?? "{}"}" />`;
  innerHTML += `<input type="hidden" id="allow_cell_edits" value="${allowCellEdits ?? "True"}" />`;
  innerHTML += `<input type="hidden" id="theme" value="${theme ?? "light"}" />`;
  innerHTML += `<input type="hidden" id="language" value="${language ?? "en"}" />`;
  innerHTML += `<input type="hidden" id="pin_menu" value="${pinMenu ?? "False"}" />`;
  innerHTML += `<input type="hidden" id="filtered_ranges" value="${filteredRanges ?? JSON.stringify({})}" />`;
  innerHTML += `<div id="content" style="height: 1000px;width: 1000px;" ></div>`;
  innerHTML += `<span id="code-title" />`;
  body.innerHTML = innerHTML;

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
  const mockChartUtils = withGlobalJquery(() => (ctx, cfg) => {
    const chartCfg = { ctx, cfg, data: cfg.data, destroyed: false };
    chartCfg.destroy = () => (chartCfg.destroyed = true);
    chartCfg.getElementsAtXAxis = _evt => [{ _index: 0 }];
    chartCfg.getElementAtEvent = _evt => [{ _datasetIndex: 0, _index: 0, _chart: { config: cfg, data: cfg.data } }];
    chartCfg.getDatasetMeta = _idx => ({ controller: { _config: { selectedPoint: 0 } } });
    chartCfg.update = _.noop;
    chartCfg.options = { scales: { xAxes: [{}] } };
    return chartCfg;
  });

  jest.mock("chart.js", () => ({
    __esModule: true,
    default: mockChartUtils,
    plugins: { register: () => undefined },
  }));
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
