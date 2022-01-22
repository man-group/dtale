import chroma from 'chroma-js';
import numeral from 'numeral';
import * as React from 'react';
import { GridCellProps } from 'react-virtualized';

import { SORT_CHARS } from '../../dtale/Header';
import { BaseOption, SortDef } from '../../redux/state/AppState';
import { CorrelationGridRow } from '../../repository/CorrelationsRepository';
import { truncate } from '../../stringUtils';

const MAX_LABEL_LEN = 18;

/** Component properties for CorrelationsCell  */
interface CorrelationsCellProps {
  correlations: CorrelationGridRow[];
  columns: Array<BaseOption<string>>;
  hasDate: boolean;
  buildTs?: (selectedCols: string[]) => void;
  buildScatter: (selectedCols: string[]) => void;
  col2?: BaseOption<string>;
  selectedCols: string[];
  colorScale: chroma.Scale<chroma.Color>;
  currSort?: SortDef;
  updateSort: (col: string) => void;
}

export const CorrelationsCell: React.FC<CorrelationsCellProps & GridCellProps> = ({
  columnIndex,
  rowIndex,
  style,
  correlations,
  columns,
  hasDate,
  buildTs,
  buildScatter,
  col2,
  selectedCols,
  colorScale,
  currSort,
  updateSort,
}) => {
  const renderHeader = (title: string, sortable = false): JSX.Element => {
    const props: React.HTMLAttributes<HTMLDivElement> = title.length >= MAX_LABEL_LEN ? { title } : {};
    if (sortable) {
      props.onClick = () => updateSort(title);
    }
    const className = `headerCell${sortable ? ' pointer' : ''}`;
    return (
      <div className={className} style={{ ...style, fontSize: '10px' }} {...props}>
        <div>
          {sortable && currSort && currSort[0] === title && SORT_CHARS[currSort[1]]}
          {truncate(title, MAX_LABEL_LEN)}
        </div>
      </div>
    );
  };

  if (rowIndex === 0) {
    if (columnIndex === 0) {
      return null;
    }
    return renderHeader(col2?.value ?? columns[columnIndex - 1].value, true);
  }
  const row = correlations[rowIndex - 1];
  if (columnIndex === 0) {
    return renderHeader(row.column);
  }
  const prop = col2?.value ?? columns[columnIndex - 1].value;
  const corrOnItself = row.column === prop || !row[prop];
  const background = (corrOnItself ? 'rgba(255,255,255,1)' : colorScale(row[prop])) as string;
  const valueStyle: React.CSSProperties = { background, textAlign: 'center' };
  const props: React.HTMLAttributes<HTMLDivElement> = {};
  if (!corrOnItself) {
    if (hasDate) {
      props.onClick = () => buildTs?.([row.column, prop]);
    } else {
      props.onClick = () => buildScatter([row.column, prop]);
    }
    valueStyle.cursor = 'pointer';
  }
  if (selectedCols[0] === row.column && selectedCols[1] === prop) {
    valueStyle.paddingTop = '.2em';
    return (
      <div className="cell d-inline" style={{ ...style, ...valueStyle }} {...props}>
        <i className="ico-show-chart float-left" />
        <span style={{ marginLeft: '-1em' }}>{corrOnItself ? 'N/A' : numeral(row[prop]).format('0.00')}</span>
      </div>
    );
  }
  return (
    <div className="cell" style={{ ...style, ...valueStyle }} {...props}>
      {corrOnItself ? 'N/A' : numeral(row[prop]).format('0.00')}
    </div>
  );
};
