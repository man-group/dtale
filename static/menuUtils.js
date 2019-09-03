import $ from "jquery";

function openMenu(namespace, open, close) {
  return e => {
    const container = $(e.target).closest("div.column-toggle");
    // add handler to close menu
    $(document).bind(`click.${namespace}`, function(e) {
      if (!container.is(e.target) && container.has(e.target).length === 0) {
        $(document).unbind(`click.${namespace}`);
        close();
      }
    });
    open();
  };
}

export default { openMenu };
