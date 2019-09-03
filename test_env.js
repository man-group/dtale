import { configure } from "enzyme";
import Adapter from "enzyme-adapter-react-16";

configure({ adapter: new Adapter() });

// Provided that we're run *after* babel-register, we can load
// filter_console, even though it's ES6.
const filterConsole = require("./static/filter_console");
filterConsole.default.ignoreDatagridWarnings();
filterConsole.default.ignoreConsoleErrors(/This browser doesn't support the `onScroll` event/);

// required for react 16
global.requestAnimationFrame = function(callback) {
  setTimeout(callback, 0);
};

// required for react-data-grid & react-bootstrap-modal in react 16
require("./static/adapter-for-react-16");
