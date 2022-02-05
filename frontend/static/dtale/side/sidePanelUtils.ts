import { SidePanelType } from '../../redux/state/AppState';

export const calcWidth = (type: SidePanelType, offset?: number, subtract = false): React.CSSProperties => {
  const style: React.CSSProperties = {};
  let baseWidth = '50vw';
  if ([SidePanelType.MISSINGNO, SidePanelType.CORRELATIONS, SidePanelType.PPS].includes(type)) {
    baseWidth = '75vw';
  }
  if (offset !== undefined) {
    let finalOffset = offset * -1; // need to reverse due to the fact the side panel opens to the left
    finalOffset = subtract ? finalOffset * -1 : finalOffset;
    const negative = finalOffset < 0;
    const absoluteOffset = negative ? finalOffset * -1 : finalOffset;
    style.width = `calc(${baseWidth} ${negative ? '-' : '+'} ${absoluteOffset}px)`;
  }
  return style;
};

const vw = (v: number): number => (v * Math.max(document.documentElement.clientWidth, window.innerWidth || 0)) / 100;

export const baseWidth = (type: SidePanelType): number =>
  [SidePanelType.MISSINGNO, SidePanelType.CORRELATIONS, SidePanelType.PPS].includes(type) ? vw(75) : vw(50);
