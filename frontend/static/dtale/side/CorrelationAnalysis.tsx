import { createSelector, PayloadAction } from '@reduxjs/toolkit';
import numeral from 'numeral';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import {
  AutoSizer as _AutoSizer,
  Column as _Column,
  Table as _Table,
  AutoSizerProps,
  ColumnProps,
  TableCellProps,
  TableHeaderProps,
  TableProps,
} from 'react-virtualized';

import { BouncerWrapper } from '../../BouncerWrapper';
import { buildSort, sortData } from '../../popups/correlations/CorrelationsGrid';
import { AppActions } from '../../redux/actions/AppActions';
import * as chartActions from '../../redux/actions/charts';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { selectDataId, selectIsArcticDB } from '../../redux/selectors';
import { DataViewerUpdate, DataViewerUpdateType, Popups, PopupType, SortDef } from '../../redux/state/AppState';
import { RemovableError } from '../../RemovableError';
import * as CorrelationsRepository from '../../repository/CorrelationsRepository';
import { StyledSlider, Thumb, Track } from '../../sliderUtils';
import * as gu from '../gridUtils';
import { SORT_CHARS } from '../Header';
import * as serverState from '../serverStateManagement';

const AutoSizer = _AutoSizer as unknown as React.FC<AutoSizerProps>;
const Column = _Column as unknown as React.FC<ColumnProps>;
const Table = _Table as unknown as React.FC<TableProps>;

/** Row in the correlations table */
interface DataRow extends CorrelationsRepository.Rank {
  selected: boolean;
  corrs: number;
}

const buildData = (
  corrs: Record<string, Record<string, number | null>>,
  ranks: CorrelationsRepository.Rank[],
  threshold: number,
  selections: Record<string, boolean>,
): DataRow[] =>
  ranks.map((row) => ({
    ...row,
    selected: selections[row.column] ?? false,
    corrs: Object.values(corrs[row.column] ?? {}).filter((corr) => corr !== null && corr > threshold).length,
  }));

const selectResult = createSelector([selectDataId, selectIsArcticDB], (dataId, isArcticDB) => ({ dataId, isArcticDB }));

const CorrelationAnalysis: React.FC<WithTranslation> = ({ t }) => {
  const { dataId, isArcticDB } = useAppSelector(selectResult);
  const dispatch = useAppDispatch();
  const openChart = (chartData: Popups): PayloadAction<Popups> => dispatch(chartActions.openChart(chartData));
  const reduxDropColumns = (columns: string[]): PayloadAction<DataViewerUpdate> =>
    dispatch(AppActions.DataViewerUpdateAction({ type: DataViewerUpdateType.DROP_COLUMNS, columns }));
  const hideSidePanel = (): PayloadAction<void> => dispatch(AppActions.HideSidePanelAction());

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<JSX.Element>();
  const [currSort, setCurrSort] = React.useState<SortDef>();
  const [selections, setSelections] = React.useState<Record<string, boolean>>({});
  const [threshold, setThreshold] = React.useState(0.5);
  const [data, setData] = React.useState<DataRow[]>([]);
  const [corrs, setCorrs] = React.useState<Record<string, Record<string, number | null>>>({});
  const [ranks, setRanks] = React.useState<CorrelationsRepository.Rank[]>([]);

  const hasUnselected = React.useMemo(
    () => Object.values(selections).find((selected) => !selected) !== undefined,
    [selections],
  );

  React.useEffect(() => {
    CorrelationsRepository.loadAnalysis(dataId).then((response) => {
      setLoading(false);
      if (response?.error) {
        setError(<RemovableError {...response} />);
        return;
      }
      if (response) {
        setCorrs(response.corrs);
        setRanks(response.ranks);
        setSelections(response.ranks.reduce((res, row) => ({ ...res, [row.column]: true }), {}));
        setData(buildData(response.corrs, response.ranks, threshold, selections));
      }
    });
  }, []);

  const headerRenderer = (props: TableHeaderProps): React.ReactNode => {
    const { dataKey, label } = props;
    if (dataKey === 'selected') {
      return <div className="headerCell">{label as any}</div>;
    }
    const onClick = (): void => {
      const updatedData = buildData(corrs ?? {}, ranks, threshold, selections);
      const updatedSort = buildSort(dataKey, currSort);
      const sortedData = sortData<DataRow>(updatedData, updatedSort);
      setCurrSort(updatedSort);
      setData(sortedData);
    };
    const [sortBy, sortDir] = !currSort ? [null, null] : currSort;
    return (
      <div className="headerCell pointer" onClick={onClick}>
        <div className="row">
          <div className="col-auto" style={{ whiteSpace: 'break-spaces' }}>
            {dataKey === sortBy ? `${sortDir ? (SORT_CHARS[sortDir] ?? '') : ''} ` : ''}
            {label as any}
          </div>
        </div>
      </div>
    );
  };

  const toggleSelected =
    (rowData: DataRow): ((e: React.MouseEvent) => void) =>
    (e: React.MouseEvent): void => {
      const updatedSelections = { ...selections, [rowData.column]: !selections[rowData.column] };
      setData(buildData(corrs, ranks, threshold, updatedSelections));
      setSelections(updatedSelections);
      e.stopPropagation();
    };

  const updateThreshold = (updatedThreshold: number): void => {
    setData(buildData(corrs, ranks, updatedThreshold, selections));
    setThreshold(updatedThreshold);
  };

  const dropColumns = (): void => {
    const colsToDrop = Object.keys(selections).filter((column) => !selections[column]);
    const title = `${t('Drop Columns', { ns: 'corr_analysis' })}?`;
    const msg = `Are you sure you would like to drop the following columns? ${colsToDrop.join(', ')}`;
    const yesAction = async (): Promise<void> => {
      await serverState.deleteColumns(dataId, colsToDrop);
      reduxDropColumns(colsToDrop);
      hideSidePanel();
    };
    openChart({ type: PopupType.CONFIRM, visible: true, title, msg, yesAction, size: 'sm' });
  };

  return (
    <>
      {error}
      <div className="row ml-0 mr-0">
        <div className="col-auto pl-0">
          <h2>{t('Feature Analysis by Correlation', { ns: 'side' })}</h2>
        </div>
        <div className="col" />
        <div className="col-auto">
          <button className="btn btn-plain" onClick={hideSidePanel}>
            <i className="ico-close pointer" title={t('side:Close') ?? ''} />
          </button>
        </div>
      </div>
      <div>
        <span className="d-inline-block pr-5 align-top mt-3">{t('corr_analysis:Threshold')}</span>
        <div className="d-inline-block" style={{ width: 200 }} data-testid="corr-threshold">
          <StyledSlider
            renderTrack={Track as any}
            renderThumb={(props: any, state: any) => Thumb(props, state)}
            value={threshold}
            min={0.0}
            max={1.0}
            step={0.01}
            onAfterChange={(value: any) => updateThreshold(value as number)}
          />
        </div>
        {!isArcticDB && hasUnselected && (
          <button className="btn btn-primary float-right pt-2 pb-2 d-inline-block" onClick={dropColumns}>
            <span>{t('Drop Unselected Columns', { ns: 'corr_analysis' })}?</span>
          </button>
        )}
      </div>
      <div className="row h-100">
        <div className="col">
          <BouncerWrapper showBouncer={loading}>
            {!error && (
              <AutoSizer>
                {({ height, width }) => (
                  <Table
                    headerHeight={40}
                    height={height < 400 ? 400 : height}
                    overscanRowCount={10}
                    rowStyle={{ display: 'flex' }}
                    rowHeight={gu.ROW_HEIGHT}
                    rowGetter={({ index }) => data[index]}
                    rowCount={data.length}
                    width={width}
                  >
                    {!isArcticDB && (
                      <Column
                        dataKey="selected"
                        label={t('corr_analysis:Keep')}
                        headerRenderer={headerRenderer}
                        width={60}
                        style={{ textAlign: 'left', paddingLeft: '.5em' }}
                        className="cell"
                        cellRenderer={(props: TableCellProps) => (
                          <div onClick={toggleSelected(props.rowData)} className="text-center pointer">
                            <i className={`ico-check-box${selections[props.rowData.column] ? '' : '-outline-blank'}`} />
                          </div>
                        )}
                      />
                    )}
                    <Column
                      dataKey="column"
                      label={t('corr_analysis:Column')}
                      headerRenderer={headerRenderer}
                      width={200}
                      flexGrow={1}
                      style={{ textAlign: 'left', paddingLeft: '.5em' }}
                      className="cell"
                    />
                    <Column
                      dataKey="score"
                      label={`${t('Max Correlation', { ns: 'corr_analysis' })}\n${t('w/ Other Columns', {
                        ns: 'corr_analysis',
                      })}`}
                      headerRenderer={headerRenderer}
                      width={100}
                      flexGrow={1}
                      style={{ textAlign: 'left', paddingLeft: '.5em' }}
                      className="cell"
                      cellRenderer={({ rowData }) =>
                        rowData.score === 'N/A' ? rowData.score : numeral(rowData.score).format('0.00')
                      }
                    />
                    <Column
                      dataKey="corrs"
                      label={`${t('Correlations', { ns: 'corr_analysis' })}\n${t('Above Threshold', {
                        ns: 'corr_analysis',
                      })}`}
                      headerRenderer={headerRenderer}
                      width={100}
                      flexGrow={1}
                      style={{ textAlign: 'left', paddingLeft: '.5em' }}
                      className="cell"
                    />
                    <Column
                      width={100}
                      dataKey="missing"
                      label={t('Missing Rows', { ns: 'corr_analysis' })}
                      headerRenderer={headerRenderer}
                      className="cell"
                    />
                  </Table>
                )}
              </AutoSizer>
            )}
          </BouncerWrapper>
        </div>
      </div>
    </>
  );
};

export default withTranslation(['menu', 'corr_analysis', 'side'])(CorrelationAnalysis);
