import * as React from 'react';
import { GlobalHotKeys } from 'react-hotkeys';

import { ColumnDef } from '../../dtale/DataViewerState';

/** Component properties for ColumnNavigation */
export interface ColumnNavigationProps {
  dtypes: ColumnDef[];
  selected?: ColumnDef;
  propagateState: (state: { selected?: ColumnDef }) => void;
}

export const ColumnNavigation: React.FC<ColumnNavigationProps> = ({ dtypes, selected, propagateState }) => {
  const up = (): void => {
    if (selected && selected?.index! < dtypes.length - 1) {
      propagateState({
        selected: dtypes.find((col) => col.index === selected.index! + 1),
      });
    }
  };

  const down = (): void => {
    if (selected && selected?.index! > 0) {
      propagateState({
        selected: dtypes.find((col) => col.index === selected.index! - 1),
      });
    }
  };

  return <GlobalHotKeys keyMap={{ COL_UP: 'up', COL_DOWN: 'down' }} handlers={{ COL_UP: up, COL_DOWN: down }} />;
};
