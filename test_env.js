import "regenerator-runtime/runtime";

import { configure } from "enzyme";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";

configure({ adapter: new Adapter() });

// required for react-data-grid & react-bootstrap-modal in react 16
require("./static/adapter-for-react-16");

// this file is compiled in an odd way so we need to mock it (react-syntax-highlighter)
jest.mock("react-syntax-highlighter/dist/esm/styles/hljs", () => ({ docco: {} }));

// globally mock this until we actually start to test it
jest.mock("plotly.js-dist", () => ({ newPlot: () => undefined }));

// this is required because cacheable-lookup creates an open handle due to it's use of AsyncResolver
jest.mock("cacheable-lookup", () => ({
  default: () => ({ lookup: () => ({}) }),
}));

// this is required for webpack dynamic public path setup
global.__webpack_public_path__ = "";
