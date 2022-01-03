import * as React from 'react';

/**
 * Build component properties for HTML button.
 *
 * @param active true, if this button is selected, false otherwise.
 * @param activate if the button is not active then execute this function when clicked.
 * @param disabled true, if this button is disabled, false otherwise.
 * @return component properties for an HTML button.
 */
export function buildButton(
  active: boolean,
  activate: () => void,
  disabled = false,
): Partial<React.HTMLProps<HTMLButtonElement>> {
  return {
    className: `btn btn-primary ${active ? 'active' : ''}`,
    onClick: active ? () => undefined : activate,
    disabled,
  };
}

/**
 * Toggle the display for an array of element ids.
 *
 * @param ids identifiers of the elements we would like to toggle the display of.
 */
export function toggleBouncer(ids: string[]): void {
  ids.forEach((id) => {
    const bouncer = document.getElementById(id);
    if (bouncer) {
      const updatedDisplay = bouncer.style.display === 'none' ? 'block' : 'none';
      bouncer.style.display = updatedDisplay;
    }
  });
}
