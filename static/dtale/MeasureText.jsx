import $ from "jquery";
import _ from "lodash";
import React from "react";

function measureText(str) {
  const o = $("#text-measure").text(str).css({
    position: "absolute",
    float: "left",
    "white-space": "nowrap",
    visibility: "hidden",
  });
  return _.round(o.width()) + 20; // 5px padding on each side
}

require("./MeasureText.css");

class MeasureText extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return <div id="text-measure" />;
  }
}
MeasureText.displayName = "MeasureText";

export { MeasureText, measureText };
