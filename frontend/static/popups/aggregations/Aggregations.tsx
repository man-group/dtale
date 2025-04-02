import { createSelector, PayloadAction } from '@reduxjs/toolkit';
import numeral from 'numeral';
import * as React from 'react';
import { default as Form } from 'react-bootstrap/Form';
import { withTranslation, WithTranslation } from 'react-i18next';

import { BouncerWrapper } from '../../BouncerWrapper';
import { ColumnDef } from '../../dtale/DataViewerState';
import { AppActions } from '../../redux/actions/AppActions';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { selectColumnAggregations, selectDataId } from '../../redux/selectors';
import { BaseOption } from '../../redux/state/AppState';
import * as AggregationsRepository from '../../repository/AggregationsRepository';
import ColumnSelect from '../create/ColumnSelect';
import { Stat } from '../describe/Stat';

import './Aggregations.css';

/** Component properties for Aggregations */
interface AggregationsProps {
  columns: ColumnDef[];
}

const selectResult = createSelector([selectDataId, selectColumnAggregations], (dataId, columnAggregations) => ({
  dataId,
  columnAggregations,
}));

const Aggregations: React.FC<AggregationsProps & WithTranslation> = ({ columns, t }) => {
  const { dataId, columnAggregations } = useAppSelector(selectResult);
  const dispatch = useAppDispatch();
  const switchCol = (colName?: string): PayloadAction<{ colName?: string }> =>
    dispatch(AppActions.UpdateColumnAggregations({ colName }));
  const close = (): PayloadAction<{ colName?: string }> => switchCol();
  const [selectedColumn, setSelectedColumn] = React.useState<BaseOption<string> | undefined>(
    columnAggregations ? { value: columnAggregations } : undefined,
  );
  const [filtered, setFiltered] = React.useState(true);
  const [loadingData, setLoadingData] = React.useState(false);
  const [data, setData] = React.useState<AggregationsRepository.AggregationsResponse>();
  const [weights, setWeights] = React.useState<BaseOption<string> | undefined>();
  const [loadingWeightedAverage, setLoadingWeightedAverage] = React.useState(false);
  const [weightedAverage, setWeightedAverage] = React.useState<number>();

  React.useEffect(() => {
    setSelectedColumn(columnAggregations ? { value: columnAggregations } : undefined);
  }, [columnAggregations]);

  React.useEffect(() => {
    if (!selectedColumn) {
      setData(undefined);
      setWeightedAverage(undefined);
      return;
    }
    if (weights && weights.value === selectedColumn?.value) {
      setWeights(undefined);
    }
    setLoadingData(true);
    AggregationsRepository.load(dataId, selectedColumn.value, filtered).then((aggResp) => {
      if (aggResp?.success) {
        setData(aggResp);
        setLoadingData(false);
        if (weights && weights.value !== selectedColumn.value) {
          setLoadingWeightedAverage(true);
          AggregationsRepository.loadWeightedAverage(dataId, selectedColumn.value, weights.value, filtered).then(
            (wgtAvgResp) => {
              setWeightedAverage(wgtAvgResp?.result);
              setLoadingWeightedAverage(false);
            },
          );
        }
      }
    });
  }, [selectedColumn, filtered]);

  React.useEffect(() => {
    if (weights && weights.value !== selectedColumn?.value) {
      setLoadingWeightedAverage(true);
      AggregationsRepository.loadWeightedAverage(dataId, selectedColumn!.value, weights.value, filtered).then(
        (wgtAvgResp) => {
          setWeightedAverage(wgtAvgResp?.result);
          setLoadingWeightedAverage(false);
        },
      );
    } else {
      setWeightedAverage(undefined);
    }
  }, [weights]);

  return (
    <div className={`side-panel-content aggregations ${!!selectedColumn ? ` is-expanded pl-5 pr-5 pt-3` : ''}`}>
      <div className="row ml-0 mr-0">
        <div className="col-auto pl-0">
          <h2>{t('Aggregations')}</h2>
        </div>
        <div className="col" />
        <div className="col-auto p-0">
          <i className="ico-close pointer" onClick={close} />
        </div>
      </div>
      <div key="body" className="modal-body">
        <div className="col-md-12" data-testid="column-aggregations">
          <ColumnSelect
            label={t('Column')}
            prop="selectedColumn"
            otherProps={['weights']}
            parent={{ weights, selectedColumn }}
            updateState={(updates: { selectedColumn?: BaseOption<string> }) => {
              setSelectedColumn(updates.selectedColumn);
              switchCol(updates.selectedColumn?.value);
            }}
            columns={columns}
            dtypes={['int', 'float']}
          />
          <Form.Switch
            id="filtered-switch"
            label={`${t('Use filtered data')}?`}
            checked={filtered}
            onChange={(e) => setFiltered(e.target.checked)}
          />
          <BouncerWrapper showBouncer={loadingData}>
            <ul>
              <Stat t={t} field="Total" value={data?.sum ? numeral(data.sum).format('0,000.0000') : undefined} />
              <Stat t={t} field="Average" value={data?.mean ? numeral(data.mean).format('0,000.0000') : undefined} />
              <Stat t={t} field="Median" value={data?.median ? numeral(data.median).format('0,000.0000') : undefined} />
              <BouncerWrapper showBouncer={loadingWeightedAverage}>
                <Stat
                  t={t}
                  field="Weighted Avg"
                  value={
                    !!weightedAverage ? numeral(weightedAverage).format('0,000.0000') : 'Please select weights below'
                  }
                />
              </BouncerWrapper>
            </ul>
            <ColumnSelect
              label={t('Weights')}
              prop="weights"
              otherProps={['selectedColumn']}
              parent={{ weights, selectedColumn }}
              updateState={(updates: { weights?: BaseOption<string> }) => setWeights(updates.weights)}
              columns={columns}
              dtypes={['int', 'float']}
            />
          </BouncerWrapper>
        </div>
      </div>
    </div>
  );
};

export default withTranslation('aggregations')(Aggregations);
