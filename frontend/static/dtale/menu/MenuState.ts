/** Base component properties for menu options */
export interface MenuOptionProps {
  open: () => void;
}

/** Component properties for menu options that can also be in ribbon menu */
export interface RibbonOptionProps {
  ribbonWrapper?: (func: () => void) => () => void;
}
