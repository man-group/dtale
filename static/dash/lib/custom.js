require("./publicDashPath");

import $ from "jquery";

function updateLanguage(e, language) {
  e.preventDefault();
  let path = `/dtale/update-language?language=${language}`;
  if (window.resourceBaseUrl) {
    path = `${window.resourceBaseUrl}/${path}`;
  }
  $.get(path, () => {
    window.location.reload();
  });
}

function openCodeSnippet(e) {
  e.preventDefault();
  window.code_popup = { code: document.getElementById("chart-code").value, title: "Charts" };

  let path = "dtale/code-popup";
  if (window.resourceBaseUrl) {
    path = `${window.resourceBaseUrl}/${path}`;
  }
  window.open(`${window.location.origin}/${path}`, "_blank", `titlebar=1,location=1,status=1,width=700,height=450`);
}

function copy(e) {
  e.preventDefault();
  const textCmp = document.getElementById("copy-text");
  let chartLink = $(e.target).parent().attr("href");
  const webRoot = window.resourceBaseUrl;
  if (webRoot) {
    chartLink = `${webRoot}${chartLink}`;
  }
  textCmp.value = `${window.location.origin}/${chartLink}`;
  textCmp.select();
  document.execCommand("copy");
  e.target.focus();
  $(e.target).parent().parent().find("div.copy-tt-hide").fadeOut(300).delay(300).fadeIn(450);
  $(e.target).parent().parent().find("div.copy-tt-bottom").fadeIn(300).delay(300).fadeOut(400);
}

function exportChart(e, href) {
  e.preventDefault();
  window.open(href + "&_id=" + new Date().getTime(), "_blank");
}

window.onload = function () {
  $("body").click(function (e) {
    const target = $(e.target);
    if (target.parent().is("a.code-snippet-btn")) {
      openCodeSnippet(e);
    } else if (target.parent().is("a.copy-link-btn")) {
      copy(e);
    } else if (target.is("a.export-chart-btn")) {
      exportChart(e, target.attr("href"));
    } else if (target.parent().is("a.export-chart-btn")) {
      exportChart(e, target.parent().attr("href"));
    } else if (target.is("a.export-png-btn")) {
      exportChart(e, target.attr("href") + "&export_type=png");
    } else if (target.parent().is("a.export-png-btn")) {
      exportChart(e, target.parent().attr("href") + "&export_type=png");
    } else if (target.is("a.lang-link")) {
      updateLanguage(e, target.attr("href"));
    }
  });
};
