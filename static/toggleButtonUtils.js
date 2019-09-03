import _ from "lodash";

function buildButton(active, activate, disabled = false) {
  return { className: `btn btn-primary ${active ? "active" : ""}`, onClick: active ? _.noop : activate, disabled };
}

export { buildButton };
