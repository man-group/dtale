import numeral from 'numeral';
import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import {
  AutoSizer as _AutoSizer,
  Column as _Column,
  Table as _Table,
  AutoSizerProps,
  ColumnProps,
  TableProps,
} from 'react-virtualized';

import * as gu from '../../dtale/gridUtils';
import { AnalysisParams, FrequencyGridData } from '../analysis/ColumnAnalysisState';

require('./FrequencyGrid.css');

const AutoSizer = _AutoSizer as unknown as React.FC<AutoSizerProps>;
const Column = _Column as unknown as React.FC<ColumnProps>;
const Table = _Table as unknown as React.FC<TableProps>;

/** Component properties for FrequencyGrid */
interface FrequencyGridProps {
  fetchedChartData: FrequencyGridData;
  finalParams: AnalysisParams;
}

/** Row definition for Frequency Grid component */
type FrequencyGridRow = { isTotals: boolean; Frequency: number; Percent: number } & Record<string, string>;

const FrequencyGrid: React.FC<FrequencyGridProps & WithTranslation> = ({ t, fetchedChartData, finalParams }) => {
  const frequencyGridRows = React.useMemo(() => {
    const gridData = fetchedChartData.data;
    const rows: FrequencyGridRow[] = [];
    const groupTotals = { Frequency: 0, Percent: 0 };
    const col = finalParams.selectedCol ?? '';
    let missingRow;
    for (let idx = 0; idx < gridData[col].length; idx++) {
      if (finalParams.splits?.length && idx && gridData[col][idx - 1] !== gridData[col][idx]) {
        const totalsRow = { [col]: 'TOTAL', ...groupTotals, isTotals: true } as FrequencyGridRow;
        finalParams.splits?.forEach((split) => (totalsRow[split.value] = ''));
        if (missingRow) {
          rows.push(missingRow);
          missingRow = undefined;
        }
        rows.push(totalsRow);
        groupTotals.Frequency = 0;
        groupTotals.Percent = 0;
      }
      const row = {
        [col]: gridData[col][idx],
        Percent: gridData.Percent[idx],
        Frequency: gridData.Frequency[idx],
        isTotals: false,
      } as FrequencyGridRow;
      finalParams.splits?.forEach((split) => (row[split.value] = gridData[split.value][idx]));
      if (finalParams.splits?.length) {
        if (finalParams.splits?.find((split) => row[split.value] === 'Missing')) {
          missingRow = row;
        } else {
          rows.push(row);
        }
      } else {
        if (row[col] === 'Missing') {
          missingRow = row;
        } else {
          rows.push(row);
        }
      }
      groupTotals.Frequency += row.Frequency;
      groupTotals.Percent += row.Percent;
    }
    const totalsRow = { [col]: t('TOTAL'), ...groupTotals, isTotals: true } as FrequencyGridRow;
    finalParams.splits?.forEach((split) => (totalsRow[split.value] = ''));
    if (missingRow) {
      rows.push(missingRow);
    }
    rows.push(totalsRow);
    return rows;
  }, [fetchedChartData]);

  const selectedCol = React.useMemo(() => finalParams.selectedCol ?? '', [finalParams]);

  const [filters, setFilters] = React.useState<Record<string, string>>({});

  const filteredData = React.useMemo(() => {
    const filterVal = filters[selectedCol];
    if (filterVal) {
      return frequencyGridRows.filter((row) => `${row[selectedCol]}`.toLowerCase().startsWith(filterVal.toLowerCase()));
    }
    return frequencyGridRows;
  }, [frequencyGridRows, filters]);

  return (
    <div style={{ height: 400, marginBottom: 10 }} data-testid="frequencies-grid">
      <AutoSizer>
        {({ height, width }) => (
          <Table
            headerHeight={gu.ROW_HEIGHT}
            headerClassName="frequency-header"
            height={height < 400 ? 400 : height}
            overscanRowCount={10}
            rowStyle={{ display: 'flex' }}
            rowHeight={gu.ROW_HEIGHT}
            rowGetter={({ index }) => filteredData[index]}
            rowCount={filteredData.length}
            rowClassName={(index) => {
              let rowClass = `frequency-row${index.index % 2 === 1 ? '-grey' : ''}`;
              if (filteredData[index.index]?.isTotals) {
                rowClass += ' frequency-row-bold';
              }
              return rowClass;
            }}
            width={width}
            className="frequencies"
          >
            <Column
              dataKey={selectedCol}
              label={selectedCol}
              width={60}
              flexGrow={1}
              style={{ textAlign: 'left', paddingLeft: '.5em' }}
              className="cell"
              headerRenderer={(props) => (
                <div className="headerCell filterable" style={{ borderWidth: 0 }}>
                  <div className="row">
                    <div className="col-auto">{selectedCol}</div>
                    <div className="col" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        onClick={(e) => e.stopPropagation()}
                        className="w-100"
                        value={filters[selectedCol] ?? ''}
                        onChange={(e) => setFilters({ ...filters, [selectedCol]: e.target.value })}
                        data-testid={`${selectedCol}-freq-filter`}
                      />
                    </div>
                  </div>
                </div>
              )}
            />
            {finalParams.splits?.map((split) => (
              <Column
                key={split.value}
                dataKey={split.value}
                label={split.value}
                width={60}
                flexGrow={1}
                style={{ textAlign: 'left', paddingLeft: '.5em' }}
                className="cell"
              />
            ))}
            <Column
              dataKey="Frequency"
              label={t('Frequency')}
              width={100}
              style={{ textAlign: 'right', paddingRight: '.5em' }}
              className="cell"
              cellRenderer={(props) => numeral(props.cellData).format('0,000')}
            />
            <Column
              dataKey="Percent"
              label={t('Percent')}
              width={100}
              style={{ textAlign: 'right', paddingRight: '.5em' }}
              className="cell"
              cellRenderer={(props) => `${numeral(props.cellData).format('0,000.00')}%`}
            />
          </Table>
        )}
      </AutoSizer>
    </div>
  );
};

export default withTranslation('describe')(FrequencyGrid);
