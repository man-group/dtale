import * as React from 'react';
import Draggable from 'react-draggable';
import { WithTranslation, withTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { createFilter, default as Select } from 'react-select';
import {
  AutoSizer as _AutoSizer,
  MultiGrid as _MultiGrid,
  AutoSizerProps,
  GridCellProps,
  MultiGridProps,
} from 'react-virtualized';

import { BouncerWrapper } from '../../BouncerWrapper';
import * as gu from '../../dtale/gridUtils';
import SidePanelButtons from '../../dtale/side/SidePanelButtons';
import { AppState, BaseOption, SortDef, SortDir } from '../../redux/state/AppState';
import { buildCorrelationsUrl, CorrelationGridRow } from '../../repository/CorrelationsRepository';
import { sortOptions } from '../analysis/filters/Constants';
import { renderCodePopupAnchor } from '../CodePopup';

import { CorrelationsCell } from './CorrelationsCell';
import * as corrUtils from './correlationsUtils';

require('./CorrelationsGrid.css');

const AutoSizer = _AutoSizer as unknown as React.FC<AutoSizerProps>;
const MultiGrid = _MultiGrid as unknown as React.FC<MultiGridProps>;

export const buildSort = (col: string, currSort?: SortDef): SortDef | undefined => {
  if (currSort && currSort[0] === col) {
    return currSort[1] === SortDir.DESC ? undefined : [col, SortDir.DESC];
  }
  return [col, SortDir.ASC];
};

export const sortData = <T extends { [k: string]: any }>(data: T[], sort?: SortDef): T[] => {
  if (sort) {
    const sorter = (rowA: T, rowB: T): number => {
      const a = rowA[sort[0]];
      const b = rowB[sort[0]];
      if (sort[1] === SortDir.ASC) {
        if (a < b) {
          return -1;
        }
        if (a > b) {
          return 1;
        }
      } else {
        if (a > b) {
          return -1;
        }
        if (a < b) {
          return 1;
        }
      }
      return 0;
    };
    return data.sort(sorter);
  }
  return data;
};

const filterData = (
  col1: BaseOption<string> | undefined,
  col2: BaseOption<string> | undefined,
  data: CorrelationGridRow[],
  sort?: SortDef,
): CorrelationGridRow[] => {
  let updatedData = sortData<CorrelationGridRow>(data, sort);
  if (col1) {
    updatedData = data.filter((row) => row.column === col1.value);
  }
  if (col2) {
    updatedData = updatedData.map(
      (row) => ({ column: row.column, [col2.value]: row[col2.value] } as CorrelationGridRow),
    );
  }
  return updatedData;
};

/** Component properties for correlations grid */
interface CorrelationsGridProps {
  correlations: CorrelationGridRow[];
  columns: string[];
  col1?: string;
  col2?: string;
  hasDate: boolean;
  selectedDate?: string;
  selectedCols: string[];
  buildTs?: (selectedCols: string[]) => void;
  buildScatter: (selectedCols: string[]) => void;
  rolling?: boolean;
  useRolling?: boolean;
  window?: number;
  minPeriods?: number;
  gridCode?: string;
  colorScale?: chroma.Scale<chroma.Color>;
  close?: JSX.Element;
  isPPS?: boolean;
  strings: string[];
  encodeStrings: boolean;
  toggleStrings: () => Promise<void>;
}

const CorrelationsGrid: React.FC<CorrelationsGridProps & WithTranslation> = ({ columns, t, ...props }) => {
  const { dataId, sidePanel, theme } = useSelector((state: AppState) => state);
  const columnOptions: Array<BaseOption<string>> = React.useMemo(
    () => columns.map((column) => ({ value: column })),
    [columns],
  );
  const [col1, setCol1] = React.useState<BaseOption<string> | undefined>(
    props.col1 ? { value: props.col1 } : undefined,
  );
  const [col2, setCol2] = React.useState<BaseOption<string> | undefined>(
    props.col2 ? { value: props.col2 } : undefined,
  );
  const [height, setHeight] = React.useState<number>(300);
  const [sort, setSort] = React.useState<SortDef>();
  const [data, setData] = React.useState<CorrelationGridRow[]>(props.correlations);

  React.useEffect(() => {
    setData(filterData(col1, col2, props.correlations, sort));
  }, [col1, col2, sort]);

  const updateSort = (col: string): void => {
    const updatedSort = buildSort(col, sort);
    setSort(updatedSort);
    setData(sortData(props.correlations, updatedSort));
  };

  const cellRenderer = (cellProps: GridCellProps): JSX.Element => (
    <CorrelationsCell
      {...cellProps}
      updateSort={updateSort}
      columns={columnOptions}
      correlations={data}
      col2={col2}
      hasDate={props.hasDate}
      buildTs={props.buildTs}
      buildScatter={props.buildScatter}
      selectedCols={props.selectedCols}
      colorScale={props.colorScale ?? corrUtils.colorScale}
      currSort={sort}
    />
  );

  const renderSelect = (
    value: BaseOption<string> | undefined,
    setter: (selected?: BaseOption<string>) => void,
    otherValue?: BaseOption<string>,
  ): JSX.Element => {
    const finalOptions = otherValue
      ? columnOptions.filter((option) => option.value !== otherValue.value)
      : columnOptions;
    return (
      <div className="input-group mr-3">
        <Select
          className="Select is-clearable is-searchable Select--single"
          classNamePrefix="Select"
          options={finalOptions.sort(sortOptions)}
          getOptionLabel={(option) => option.value}
          getOptionValue={(option) => option.value}
          value={value ?? null}
          onChange={(selected: BaseOption<string> | null): void => setter(selected ?? undefined)}
          noOptionsMessage={() => t('No columns found', { ns: 'correlations' })}
          isClearable={true}
          filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
        />
      </div>
    );
  };

  const exportImage = (
    <div className="col-auto pr-0 mb-auto mt-auto">
      <button
        className="btn btn-plain"
        onClick={() => window.open(buildCorrelationsUrl(dataId, props.encodeStrings, props.isPPS, true), '_blank')}
      >
        <i className="fas fa-file-code pr-3" />
        <span className="align-middle">{t('Export Image', { ns: 'correlations' })}</span>
      </button>
    </div>
  );

  return (
    <BouncerWrapper showBouncer={!!props.correlations?.length === false}>
      <div className="row pb-5">
        <div className="col-auto p-0">
          <h2 className="m-0">
            {props.isPPS !== true && t('Pearson Correlation Matrix', { ns: 'correlations' })}
            {props.isPPS === true && t('Predictive Power Score', { ns: 'menu' })}
          </h2>
          <small>
            (
            {t('Click on any cell to view the details of that correlation', {
              ns: 'correlations',
            })}
            )
          </small>
        </div>
        <div className="col" />
        <SidePanelButtons buttons={exportImage} />
        {!sidePanel.visible && exportImage}
      </div>
      <AutoSizer className="correlations-grid" disableHeight={true}>
        {({ width }) => (
          <>
            <div style={{ width }} className="row pt-3 pb-3 correlations-filters">
              <span className="mb-auto mt-auto">{t('View Correlation(s) For', { ns: 'correlations' })}</span>
              <div className="col-auto">{renderSelect(col1, setCol1, col2)}</div>
              <span className="mb-auto mt-auto">{t('vs.', { ns: 'correlations' })}</span>
              <div className="col-auto">{renderSelect(col2, setCol2, col1)}</div>
              <div className="col pr-0 text-right">
                {props.gridCode && renderCodePopupAnchor(props.gridCode, t('Correlations', { ns: 'menu' }))}
              </div>
            </div>
            {props.strings.length > 0 && (
              <div style={{ width }} className="row pt-3 pb-3 correlations-filters">
                <span className="mb-auto mt-auto">{t('Encode Strings', { ns: 'correlations' })}?</span>
                <div className="col-auto mt-auto mb-auto pl-5 hoverable" style={{ borderBottom: 'none' }}>
                  <i
                    className={`ico-check-box${props.encodeStrings ? '' : '-outline-blank'} pointer`}
                    onClick={props.toggleStrings}
                  />
                  <div className="hoverable__content encode-strings">
                    {`${t('correlations:encode_strings_tt')} ${props.strings.join(', ')}`}
                  </div>
                </div>
              </div>
            )}
            <MultiGrid
              {...gu.buildGridStyles(theme)}
              scrollToColumn={0}
              scrollToRow={0}
              cellRenderer={cellRenderer}
              fixedColumnCount={1}
              fixedRowCount={1}
              rowCount={(col1 ? 1 : data.length) + 1}
              columnCount={(col2 ? 1 : columns.length) + 1}
              height={height}
              columnWidth={100}
              rowHeight={gu.ROW_HEIGHT}
              width={width}
            />
            <Draggable
              axis="y"
              defaultClassName="CorrDragHandle"
              defaultClassNameDragging="CorrDragHandleActive"
              onDrag={(_e, { deltaY }) => setHeight(Math.max(height + deltaY, 300))}
              position={{ x: 0, y: 0 }}
            >
              <div className="CorrDragHandleIcon">...</div>
            </Draggable>
          </>
        )}
      </AutoSizer>
    </BouncerWrapper>
  );
};

export default withTranslation(['correlations', 'menu'])(CorrelationsGrid);
