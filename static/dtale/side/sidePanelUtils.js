import _ from "lodash";

export function calcWidth(type, offset, subtract = false) {
  const style = {};
  let baseWidth = "50vw";
  if (_.includes(["missingno", "correlations", "pps"], type)) {
    baseWidth = "75vw";
  }
  if (offset !== undefined) {
    let finalOffset = offset * -1; // need to reverse due to the fact the side panel opens to the left
    finalOffset = subtract ? finalOffset * -1 : finalOffset;
    const negative = finalOffset < 0;
    const absoluteOffset = negative ? finalOffset * -1 : finalOffset;
    style.width = `calc(${baseWidth} ${negative ? "-" : "+"} ${absoluteOffset}px)`;
  }
  return style;
}

function vw(v) {
  var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  return (v * w) / 100;
}

export function baseWidth(type) {
  return _.includes(["missingno", "correlations", "pps"], type) ? vw(75) : vw(50);
}
