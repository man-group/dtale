import _ from "lodash";

function formatScatterPoints(chartData, formatter = p => p, highlight = () => false, filter = () => false) {
  const data = [],
    pointBackgroundColor = [],
    pointRadius = [],
    pointHoverRadius = [],
    pointHitRadius = [];

  const highlighted = [];
  _.forEach(chartData, p => {
    let bg; // set to undefined so Chart.js default color will be applied
    let rad = 3,
      hoverRad = 4,
      hitRad = 1; // Chart.js default values
    const isHighlighted = highlight(p);
    if (isHighlighted) {
      bg = "#337ab7";
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

function getMin(data, prop) {
  const min = _.min(_.map(data, prop));
  return _.floor(min + (min % 1 ? 0 : -1)) - 0.5;
}

function getMax(data, prop) {
  const max = _.max(_.map(data, prop));
  return _.ceil(max + (max % 1 ? 0 : 1)) + 0.5;
}

export { formatScatterPoints, getMin, getMax };
