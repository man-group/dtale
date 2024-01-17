import { createSelector } from '@reduxjs/toolkit';
import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import * as chartUtils from '../../chartUtils';
import * as actions from '../../redux/actions/dtale';
import { useAppSelector } from '../../redux/hooks';
import { selectChartData, selectDataId } from '../../redux/selectors';
import { ColumnAnalysisPopupData } from '../../redux/state/AppState';

import { AnalysisParams, AnalysisState, AnalysisType } from './ColumnAnalysisState';
import { dataLoader } from './columnAnalysisUtils';
import ColumnAnalysisFilters from './filters/ColumnAnalysisFilters';
import { analysisAggs } from './filters/Constants';

require('./ColumnAnalysis.css');

/** Component properties for ColumnAnalysis */
interface ColumnAnalysisProps {
  height?: number;
}

const selectResult = createSelector([selectDataId, selectChartData], (dataId, chartData) => ({
  chartData: chartData as ColumnAnalysisPopupData,
  dataId,
}));

const ColumnAnalysis: React.FC<ColumnAnalysisProps & WithTranslation> = ({ height, t }) => {
  const { chartData, dataId } = useAppSelector(selectResult);
  const chartRef = React.useRef<chartUtils.ChartObj | undefined>();
  const [defaultCategoryAgg, defaultOrdinalAgg] = React.useMemo(() => {
    const aggs = analysisAggs(t);
    return [aggs.find((option) => option.value === 'mean')!, aggs.find((option) => option.value === 'sum')!];
  }, [t]);
  const [state, setState] = React.useState<AnalysisState>({
    type: AnalysisType.HISTOGRAM,
    ordinalAgg: defaultOrdinalAgg,
    categoryAgg: defaultCategoryAgg,
  });

  const buildAnalysis = async (currentParams?: AnalysisParams): Promise<void> => {
    if (!chartData.visible) {
      return;
    }
    const propagateState = (updatedState: Partial<AnalysisState>): void => setState({ ...state, ...updatedState });
    await dataLoader(
      { chartData, dataId, height },
      state,
      propagateState,
      chartRef,
      (chart?: chartUtils.ChartObj) => (chartRef.current = chart),
      currentParams,
    );
  };

  React.useEffect(() => {
    buildAnalysis();
  }, []);

  return (
    <React.Fragment>
      {actions.isPopup() && (
        <div className="modal-header">
          <h4 className="modal-title">
            <i className="ico-equalizer" />
            {` ${t(state?.type === AnalysisType.HISTOGRAM ? 'Histogram' : 'Value Counts', { ns: 'constants' })} ${t(
              'analysis:for',
            )} `}
            <strong>{chartData.selectedCol}</strong>
            {state?.query && <small>{state.query}</small>}
            <div id="describe" />
          </h4>
        </div>
      )}
      {state?.type && (
        <div className="modal-form">
          <ColumnAnalysisFilters
            type={state.type}
            cols={state.cols}
            dtype={state.dtype}
            code={state.code}
            top={state.top}
            selectedCol={chartData.selectedCol}
            buildChart={buildAnalysis}
          />
        </div>
      )}
      <div className="modal-body">
        {state.error}
        {state.chart}
      </div>
    </React.Fragment>
  );
};

export default withTranslation(['constants', 'analysis'])(ColumnAnalysis);
