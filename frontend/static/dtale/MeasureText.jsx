import React from 'react';

export function measureText(str) {
  const o = document.getElementById('text-measure');
  o.textContent = str;
  const styles = {
    'font-family': `"Istok", "Helvetica", Arial, sans-serif`,
    'font-weight': 'bold',
    'font-size': '0.8125rem',
    position: 'absolute',
    float: 'left',
    'white-space': 'nowrap',
    visibility: 'hidden',
  };
  for (const [key, value] of Object.entries(styles)) {
    o.style[key] = value;
  }
  return Math.round(o.getBoundingClientRect().width) + 20; // 5px padding on each side
}

export class MeasureText extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return <span id="text-measure" />;
  }
}
MeasureText.displayName = 'MeasureText';
