import * as React from 'react';

/**
 * Attaches click handler to window and removes it when user clicks outside of container.
 *
 * @param close callback for when user unbinds handler
 * @param container element which, if clicked outside, unbinds the handler
 * @param clickFilters handler to check if click event target should be ignored
 */
export function buildClickHandler(
  close: () => void,
  container?: HTMLElement | null,
  clickFilters?: (e: MouseEvent) => boolean,
): void {
  const clickHandler = (e: MouseEvent): void => {
    if (clickFilters?.(e)) {
      return;
    }
    const unbind = !container || (container !== e.target && !container.contains(e.target as HTMLElement));
    if (unbind) {
      window.removeEventListener('click', clickHandler);
      close();
    }
  };
  window.addEventListener('click', clickHandler);
}

/**
 * Builds click handler for opening/closing a menu.
 *
 * @param open callback for when the menu is opened.
 * @param close callback for when the menu is closed.
 * @param toggleRef reference to the element which triggered the opening of the menu.
 * @param clickFilters handler to check if click event target should be ignored.
 * @return click handler for opening/closing menu.
 */
export function openMenu(
  open: (e: React.MouseEvent) => void,
  close: () => void,
  toggleRef?: React.RefObject<HTMLElement>,
  clickFilters?: (e: MouseEvent) => boolean,
): (e: React.MouseEvent) => void {
  return (e: React.MouseEvent): void => {
    // add handler to close menu
    buildClickHandler(close, toggleRef?.current, clickFilters);
    open(e);
  };
}
