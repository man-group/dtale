import { ColumnDef } from '../../dtale/DataViewerState';

export const mockColumnDef = (overrides?: Partial<ColumnDef>): ColumnDef => ({
  name: 'col',
  dtype: 'object',
  visible: true,
  unique_ct: 10,
  locked: false,
  index: 0,
  ...overrides,
});
