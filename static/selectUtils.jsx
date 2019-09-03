import _ from "lodash";

function loadSelection(comp, prop = "name") {
  if (_.get(comp, "state.menuIsOpen")) {
    return;
  }
  const inputValue = _.get(comp, ["state", "value", prop], _.get(comp, ["props", "value", prop], ""));
  comp.setState({ inputValue });
}

export default { loadSelection };
