import { openMenu } from '../../menuUtils';
import { PredefinedFilter } from '../../redux/state/AppState';

/** Different menu types */
export enum InfoMenuType {
  FILTER,
  SORT,
  HIDDEN,
  ARCTICDB,
}

export const buildMenuHandler = (
  type: InfoMenuType,
  setMenuOpen: (menu?: InfoMenuType) => void,
  toggleRef: React.RefObject<HTMLDivElement>,
): ((e: React.MouseEvent) => void) =>
  openMenu(
    (): void => setMenuOpen(type),
    (): void => setMenuOpen(undefined),
    toggleRef,
    (e: MouseEvent): boolean => {
      const ignoreClick = (target: HTMLElement): boolean => target.className.indexOf('ignore-click') !== -1;
      const target = e.target as HTMLElement;
      return ignoreClick(target) || (target.parentNode !== undefined && ignoreClick(target.parentNode as HTMLElement));
    },
  );

export const predefinedFilterStr = (
  filters: PredefinedFilter[],
  name: string,
  value?: string | string[],
): string | undefined => {
  if (value && filters.find((f) => f.name === name)?.inputType === 'multiselect') {
    return `(${(value as string[]).join(', ')})`;
  }
  return value as string;
};
