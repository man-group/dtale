import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { AutoSizer, Column, SortDirectionType, Table, TableHeaderProps } from 'react-virtualized';

import { ColumnDef } from '../../dtale/DataViewerState';
import * as gu from '../../dtale/gridUtils';
import { SortDef, SortDir } from '../../redux/state/AppState';

import { VisibilityState } from './DescribeState';

require('./DtypesGrid.css');

/** Component properties for SortIndicator */
interface SortIndicatorProps {
  sort: SortDef;
  dataKey: string;
}

export const SortIndicator: React.FC<SortIndicatorProps> = ({ sort, dataKey }) => (
  <React.Fragment>
    {sort[0] !== dataKey && <svg width={18} height={18} style={{ verticalAlign: 'bottom' }} />}
    {sort[0] === dataKey && (
      <svg
        className={`ReactVirtualized__Table__sortableHeaderIcon ReactVirtualized__Table__sortableHeaderIcon--${sort[1]}`}
        width={18}
        height={18}
        viewBox="0 0 24 24"
        style={{ verticalAlign: 'bottom' }}
      >
        {sort[1] === SortDir.ASC && <path d="M7 14l5-5 5 5z" />}
        {sort[1] === SortDir.DESC && <path d="M7 10l5 5 5-5z" />}
        <path d="M0 0h24v24H0z" fill="none" />
      </svg>
    )}
  </React.Fragment>
);

const sortData = (data: DtypesGridRow[], sort: SortDef): DtypesGridRow[] => {
  const sorter = (rowA: DtypesGridRow, rowB: DtypesGridRow): number => {
    const a = (rowA as any)[sort[0]];
    const b = (rowB as any)[sort[0]];
    if (['index', 'visible'].includes(sort[0])) {
      if (a < b) {
        return sort[1] === SortDir.ASC ? -1 : 1;
      }
      if (a > b) {
        return sort[1] === SortDir.ASC ? 1 : -1;
      }
      return 0;
    } else {
      const val = a.toLowerCase().localeCompare(b.toLowerCase());
      return sort[1] === SortDir.ASC ? val : -val;
    }
  };
  return data.sort(sorter);
};

/** sort change parameters from react-virtualized */
type SortInfo = { sortBy: string; sortDirection: SortDirectionType };

const buildSort = (sort: SortDef, info: SortInfo): SortDef => {
  if (info.sortBy === sort?.[0] && sort?.[1] === SortDir.DESC) {
    return ['index', SortDir.ASC];
  }
  return [info.sortBy, info.sortDirection as SortDir];
};

/** Component properties for DtypesGrid */
interface DtypesGridProps {
  dtypes: ColumnDef[];
  setSelected: (selected?: ColumnDef) => void;
  setVisibility: (visibility: VisibilityState) => void;
}

/** Row records in data types grid */
interface DtypesGridRow extends ColumnDef {
  selected: boolean;
}

const DtypesGrid: React.FC<DtypesGridProps & WithTranslation> = ({ dtypes, t, setSelected, setVisibility }) => {
  const [sort, setSort] = React.useState<SortDef>(['index', SortDir.ASC]);
  const [data, setData] = React.useState<DtypesGridRow[]>(
    dtypes.map((col, index) => ({ ...col, selected: index === 0 })),
  );
  const [dtypesFilter, setDtypesFilter] = React.useState<string>();
  const [allVisible, setAllVisible] = React.useState(gu.noHidden(dtypes));

  const headerRenderer = (props: TableHeaderProps): JSX.Element => {
    const { dataKey, label } = props;
    if (dataKey === 'visible') {
      const onClick = (e: React.MouseEvent): void => {
        const updatedData = data.map((d) => ({ ...d, visible: !allVisible }));
        setData(updatedData);
        setVisibility(updatedData.reduce((ret, d) => ({ ...ret, [d.name]: d.visible }), {}));
        setAllVisible(!allVisible);
        e.stopPropagation();
      };
      return (
        <div className="headerCell pointer" onClick={onClick}>
          {label}
          <i className={`ico-check-box${allVisible ? '' : '-outline-blank'}`} onClick={onClick} />
        </div>
      );
    }
    return (
      <div className="headerCell filterable">
        <div className="row">
          <div className="col-auto">
            {label}
            <SortIndicator dataKey={dataKey} sort={sort} />
          </div>
          {dataKey === 'name' && (
            <div className="col" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                onClick={(e) => e.stopPropagation()}
                className="w-100"
                value={dtypesFilter || ''}
                onChange={(e) => setDtypesFilter(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const currDtypes = sortData(
    dtypesFilter ? data.filter(({ name }) => name.toLowerCase().includes(dtypesFilter.toLowerCase())) : data,
    sort,
  );
  return (
    <AutoSizer>
      {({ height, width }) => (
        <Table
          headerHeight={40}
          height={height < 400 ? 400 : height}
          overscanRowCount={10}
          rowStyle={{ display: 'flex' }}
          rowHeight={gu.ROW_HEIGHT}
          rowGetter={({ index }) => currDtypes[index]}
          rowCount={currDtypes.length}
          rowClassName={(index) => (data[index.index]?.selected ? 'dtype-row-selected' : 'dtype-row')}
          sort={(info) => setSort(buildSort(sort, info))}
          sortBy={sort[0]}
          sortDirection={sort[1]}
          width={width}
          onRowClick={(info) => {
            setData(data.map((d) => ({ ...d, selected: d.name === info.rowData.name })));
            setSelected(info.rowData);
          }}
          className="dtypes"
        >
          <Column
            dataKey="index"
            label="#"
            headerRenderer={headerRenderer}
            width={35}
            style={{ textAlign: 'center' }}
            className="cell"
          />
          <Column
            dataKey="visible"
            label={t('Visible')}
            headerRenderer={headerRenderer}
            width={60}
            style={{ textAlign: 'left', paddingLeft: '.5em' }}
            className="cell"
            cellRenderer={({ rowData }) => (
              <div
                onClick={(e: React.MouseEvent) => {
                  const updatedData = data.map((d) =>
                    d.name === rowData.name ? { ...d, visible: !rowData.visible } : d,
                  );
                  setData(updatedData);
                  setVisibility(updatedData.reduce((ret, d) => ({ ...ret, [d.name]: d.visible }), {}));
                  e.stopPropagation();
                }}
                className="text-center pointer"
              >
                <i className={`ico-check-box${rowData.visible ? '' : '-outline-blank'}`} />
              </div>
            )}
          />
          <Column
            dataKey="name"
            label={t('Column Name')}
            headerRenderer={headerRenderer}
            width={200}
            flexGrow={1}
            style={{ textAlign: 'left', paddingLeft: '.5em' }}
            className="cell"
          />
          <Column
            width={100}
            dataKey="dtype"
            label={t('Data Type')}
            headerRenderer={headerRenderer}
            style={{
              textAlign: 'right',
              paddingLeft: '.5em',
              paddingTop: '.35em',
              fontSize: '80%',
            }}
            className="cell"
          />
        </Table>
      )}
    </AutoSizer>
  );
};

export default withTranslation('describe')(DtypesGrid);
