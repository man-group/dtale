import * as React from 'react';

import { ColumnDef } from '../../dtale/DataViewerState';

/** Component properties for ColumnNavigation */
export interface ColumnNavigationProps {
  dtypes: ColumnDef[];
  selectedIndex: number;
  setSelected: (selected?: ColumnDef) => void;
}

export const ColumnNavigation: React.FC<ColumnNavigationProps> = ({ dtypes, selectedIndex, setSelected }) => {
  React.useEffect(() => {
    const keyPress = (e: KeyboardEvent): void => {
      const elements = document.querySelectorAll('.Select');
      for (const element of Array.from(elements)) {
        if ((element as Element).contains(e.target as Element)) {
          return;
        }
      }
      if (e.key === 'ArrowUp') {
        if (selectedIndex > 0) {
          setSelected(dtypes.find((col) => col.index === selectedIndex - 1));
          e?.stopPropagation();
          return;
        }
      } else if (e.key === 'ArrowDown') {
        if (selectedIndex < dtypes.length - 1) {
          setSelected(dtypes.find((col) => col.index === selectedIndex + 1));
          e?.stopPropagation();
          return;
        }
      }
    };
    document.addEventListener('keydown', keyPress);
    return () => document.removeEventListener('keydown', keyPress);
  }, [selectedIndex, dtypes]);

  return null;
};
