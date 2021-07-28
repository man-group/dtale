import "regenerator-runtime/runtime";

import { configure } from "enzyme";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";

configure({ adapter: new Adapter() });

// required for react-data-grid & react-bootstrap-modal in react 16
require("./static/adapter-for-react-16");

// this file is compiled in an odd way so we need to mock it (react-syntax-highlighter)
jest.mock("react-syntax-highlighter/dist/esm/styles/hljs", () => ({ docco: {} }));

// globally mock this until we actually start to test it
jest.mock("plotly.js-geo-dist-min", () => ({ newPlot: () => undefined }));

jest.mock("react-i18next", () => ({
  // this mock makes sure any components using the translate HoC receive the t function as a prop
  withTranslation: () => Component => {
    const _ = require("lodash");
    const convertKey = key => {
      const keySegs = _.split(key, ":");
      if (keySegs.length > 2) {
        return _.join(_.tail(keySegs), ":");
      } else if (keySegs.length == 2) {
        return _.last(keySegs);
      }
      return key;
    };
    Component.defaultProps = {
      ...Component.defaultProps,
      t: convertKey,
      i18n: {
        language: "en",
        options: { resources: { en: {}, cn: {} } },
        changeLanguage: () => undefined,
      },
    };
    return Component;
  },
}));

jest.mock("chartjs-plugin-zoom", () => ({}));
jest.mock("@sgratzl/chartjs-chart-boxplot", () => ({ BoxController: {} }));
jest.mock("chart.js", () => {
  class MockChart {
    constructor() {}
    destroy() {}
  }
  MockChart.register = () => undefined;
  return {
    Chart: MockChart,
  };
});

// this is required for webpack dynamic public path setup
global.__webpack_public_path__ = "";
