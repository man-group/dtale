import _ from "lodash";
import $ from "jquery";

function buildButton(active, activate, disabled = false) {
  return { className: `btn btn-primary ${active ? "active" : ""}`, onClick: active ? _.noop : activate, disabled };
}

function toggleBouncer(ids) {
  _.forEach(ids, id => $("#" + id).toggle());
}

export { buildButton, toggleBouncer };
