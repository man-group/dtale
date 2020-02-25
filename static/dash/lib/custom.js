import $ from "jquery";

function openCodeSnippet(e) {
  e.preventDefault();
  window.code_popup = { code: document.getElementById("chart-code").value, title: "Charts" };
  window.open("../dtale/code-popup", "_blank", `titlebar=1,location=1,status=1,width=700,height=450`);
}

function copy(e) {
  e.preventDefault();
  const textCmp = document.getElementById("copy-text");
  const chartLink = $(e.target)
    .parent()
    .attr("href");
  textCmp.value = `${window.location.origin}${chartLink}`;
  textCmp.select();
  document.execCommand("copy");
  e.target.focus();
  $(e.target)
    .parent()
    .parent()
    .find("div.copy-tt-bottom")
    .fadeIn(300)
    .delay(300)
    .fadeOut(400);
}

window.onload = function() {
  $("body").click(function(e) {
    const target = $(e.target);
    if (target.parent().is("a.code-snippet-btn")) {
      openCodeSnippet(e);
    } else if (target.parent().is("a.copy-link-btn")) {
      copy(e);
    }
  });
};
