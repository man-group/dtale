import $ from "jquery";

function openMenu(namespace, open, close, selector = "div.column-toggle", clickFilters = () => false) {
  return e => {
    const container = $(e.target).closest(selector);
    // add handler to close menu
    $(document).bind(`click.${namespace}`, function (e) {
      if (clickFilters(e)) {
        return;
      }
      if (!container.is(e.target) && container.has(e.target).length === 0) {
        $(document).unbind(`click.${namespace}`);
        close();
      }
    });
    open(e);
  };
}

export default { openMenu };
