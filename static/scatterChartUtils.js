import _ from "lodash";

const basePointFormatter = (xProp, yProp) => point => _.assignIn(point, { x: point[xProp], y: point[yProp] });

function formatScatterPoints(chartData, formatter = p => p, highlight = () => false, filter = () => false) {
  const data = [],
    pointBackgroundColor = [],
    pointRadius = [],
    pointHoverRadius = [],
    pointHitRadius = [];

  const highlighted = [];
  _.forEach(chartData, p => {
    let bg = "rgb(42, 145, 209)";
    let rad = 3,
      hoverRad = 4,
      hitRad = 1; // Chart.js default values
    const isHighlighted = highlight(p);
    if (isHighlighted) {
      bg = "#b73333";
      rad = 5;
      hoverRad = 6;
      hitRad = 6;
    }

    if (filter(p)) {
      rad = hoverRad = hitRad = 0;
    }
    const d = formatter(p);
    if (isHighlighted) {
      highlighted.push({ bg, rad, hoverRad, hitRad, d });
      return;
    }

    pointBackgroundColor.push(bg);
    pointRadius.push(rad);
    pointHoverRadius.push(hoverRad);
    pointHitRadius.push(hitRad);
    data.push(d);
  });

  // highlighted items in the fore-front
  _.forEach(highlighted, h => {
    const { bg, rad, hoverRad, hitRad, d } = h;
    pointBackgroundColor.push(bg);
    pointRadius.push(rad);
    pointHoverRadius.push(hoverRad);
    pointHitRadius.push(hitRad);
    data.push(d);
  });

  return {
    data,
    pointBackgroundColor,
    pointRadius,
    pointHoverRadius,
    pointHitRadius,
    pointHoverBackgroundColor: pointBackgroundColor,
  };
}

function getScatterMin(data, prop = null) {
  const min = _.min(_.isNull(prop) ? data : _.map(data, prop));
  return _.floor(min + (min % 1 ? 0 : -1)) - 0.5;
}

function getScatterMax(data, prop = null) {
  const max = _.max(_.isNull(prop) ? data : _.map(data, prop));
  return _.ceil(max + (max % 1 ? 0 : 1)) + 0.5;
}

export { basePointFormatter, formatScatterPoints, getScatterMin, getScatterMax };
