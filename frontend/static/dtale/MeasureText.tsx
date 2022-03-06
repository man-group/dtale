import * as React from 'react';

export const measureText = (str: string): number => {
  const o = document.getElementById('text-measure') as HTMLSpanElement;
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
    (o.style as any)[key] = value;
  }
  return Math.round(o.getBoundingClientRect().width) + 20; // 5px padding on each side
};

export const MeasureText: React.FC = () => <span id="text-measure" />;
