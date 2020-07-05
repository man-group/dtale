import $ from "jquery";

function buildClickHandler(namespace, close, container = null, clickFilters = () => false) {
  $(document).bind(`click.${namespace}`, function (e) {
    if (clickFilters(e)) {
      return;
    }
    const unbind = !container || (!container.is(e.target) && container.has(e.target).length === 0);
    if (unbind) {
      $(document).unbind(`click.${namespace}`);
      close();
    }
  });
}

function openMenu(namespace, open, close, selector = "div.column-toggle", clickFilters = () => false) {
  return e => {
    const container = $(e.target).closest(selector);
    // add handler to close menu
    buildClickHandler(namespace, close, container, clickFilters);
    open(e);
  };
}

export default { openMenu, buildClickHandler };
