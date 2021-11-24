import { openMenu } from '../../menuUtils';
import _ from 'lodash';

export function buildMenuHandler(prop, propagateState, toggleRef) {
  return openMenu(
    () => propagateState({ menuOpen: prop }),
    () => propagateState({ menuOpen: null }),
    toggleRef,
    (e) => {
      const ignoreClick = (target) => target.className.indexOf('ignore-click') !== -1;
      return ignoreClick(e.target) || ignoreClick(e.target.parentNode);
    },
  );
}

export function predefinedFilterStr(filters, name, value) {
  if (value && _.find(filters, { name })?.inputType === 'multiselect') {
    return `(${_.join(value, ', ')})`;
  }
  return value;
}
