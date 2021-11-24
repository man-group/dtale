import * as gu from '../gridUtils';

export function buildCaretClass(caretPct = 90) {
  const lastStyleKey = Object.keys(document.styleSheets).pop();
  const lastStyleRules = document.styleSheets[lastStyleKey];
  if (lastStyleRules.rules?.[0]?.selectorText === '.column-toggle__dropdown::before') {
    return; // don't continually add styling if its already set
  }
  const styleSheetElement = document.createElement('style');
  styleSheetElement.type = 'text/css';
  const finalCaretPct = caretPct ?? 90;
  styleSheetElement.innerHTML = '.column-toggle__dropdown::before {right: ' + finalCaretPct + '%}';
  styleSheetElement.innerHTML += '.column-toggle__dropdown::after {right: ' + finalCaretPct + '%}';
  document.getElementsByTagName('head')[0].appendChild(styleSheetElement);
}

export function positionMenu(selectedToggle, menuDiv, isPreview, dropRibbon) {
  const toggleRect = selectedToggle?.getBoundingClientRect();
  const currLeft = toggleRect?.left ?? 0;
  let currTop = isPreview ? 0 : toggleRect?.top ?? 0;
  currTop += dropRibbon ? -25 : 0;
  const divWidth = Math.max(menuDiv.current?.getBoundingClientRect()?.width, 210) + 20;
  const css = { minWidth: '14em' };
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
}

export function ignoreMenuClicks(e) {
  const colFilter = document.getElementsByClassName('column-filter')[0];
  if (colFilter && (colFilter === e.target || colFilter.contains(e.target))) {
    return true; // ignore filter clicks
  }
  if (colFilter && e.target.classList.contains('Select__option')) {
    return true; // ignore option selection
  }
  if (e.target.classList.contains('ico-info')) {
    return true; // ignore option selection
  }
  if (colFilter && e.target.nodeName === 'svg') {
    return true; // ignore option selection
  }
  return false;
}
