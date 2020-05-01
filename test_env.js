import "regenerator-runtime/runtime";

import { configure } from "enzyme";
import Adapter from "enzyme-adapter-react-16";

configure({ adapter: new Adapter() });

// required for react-data-grid & react-bootstrap-modal in react 16
require("./static/adapter-for-react-16");

// this file is compiled in an odd way so we need to mock it (react-syntax-highlighter)
jest.mock("react-syntax-highlighter/dist/esm/styles/hljs", () => ({ docco: {} }));

// this is required for webpack dynamic public path setup
global.__webpack_public_path__ = "";
