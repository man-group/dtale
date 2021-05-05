import $ from "jquery";
import _ from "lodash";
import React from "react";

export function measureText(str) {
  const o = $("#text-measure").text(str).css({
    "font-family": `"Istok", "Helvetica", Arial, sans-serif`,
    "font-weight": "bold",
    "font-size": "0.8125rem",
    position: "absolute",
    float: "left",
    "white-space": "nowrap",
    visibility: "hidden",
  });
  return _.round(o.width()) + 20; // 5px padding on each side
}

export class MeasureText extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return <span id="text-measure" />;
  }
}
MeasureText.displayName = "MeasureText";
