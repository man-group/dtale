import * as gu from '../gridUtils';

export const buildCaretClass = (caretPct = 90): void => {
  const lastStyleRules = Object.values(document.styleSheets).pop();
  if ((lastStyleRules?.rules?.[0] as any)?.selectorText === '.column-toggle__dropdown::before') {
    return; // don't continually add styling if its already set
  }
  const styleSheetElement = document.createElement('style');
  styleSheetElement.type = 'text/css';
  const finalCaretPct = caretPct ?? 90;
  styleSheetElement.innerHTML = '.column-toggle__dropdown::before {right: ' + finalCaretPct + '%}';
  styleSheetElement.innerHTML += '.column-toggle__dropdown::after {right: ' + finalCaretPct + '%}';
  document.getElementsByTagName('head')[0].appendChild(styleSheetElement);
};

export const positionMenu = (
  selectedToggle: HTMLElement,
  menuDiv: React.RefObject<HTMLDivElement>,
  isPreview = false,
  dropRibbon = false,
): React.CSSProperties => {
  const toggleRect = selectedToggle?.getBoundingClientRect();
  const currLeft = toggleRect?.left ?? 0;
  let currTop = isPreview ? 0 : toggleRect?.top ?? 0;
  currTop += dropRibbon ? -25 : 0;
  const divWidth = Math.max(menuDiv.current?.getBoundingClientRect()?.width ?? 0, 210) + 20;
  const css: React.CSSProperties = { minWidth: '14em' };
  if (currLeft + divWidth > window.innerWidth) {
    const finalLeft = currLeft - (currLeft + divWidth + 20 - window.innerWidth);
    css.left = finalLeft;
    const overlapPct = (currLeft - (finalLeft - 20)) / divWidth;
    const caretPct = Math.floor(100 - overlapPct * 100);
    buildCaretClass(caretPct);
  } else {
    css.left = currLeft;
    buildCaretClass();
  }
  css.top = currTop + gu.ROW_HEIGHT - 6;
  if (isPreview) {
    css.left -= 40;
  }
  return css;
};

export const ignoreMenuClicks = (e: MouseEvent): boolean => {
  const colFilter = document.getElementsByClassName('column-filter')[0];
  const target = e.target as HTMLElement;
  if (colFilter && (colFilter === target || colFilter.contains(target))) {
    return true; // ignore filter clicks
  }
  if (colFilter && target.classList.contains('Select__option')) {
    return true; // ignore option selection
  }
  if (target.classList.contains('ico-info')) {
    return true; // ignore option selection
  }
  if (colFilter && target.nodeName === 'svg') {
    return true; // ignore option selection
  }
  return false;
};
