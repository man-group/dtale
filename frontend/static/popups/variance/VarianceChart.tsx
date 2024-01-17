import { createSelector } from '@reduxjs/toolkit';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { useAppSelector } from '../../redux/hooks';
import { selectChartData, selectDataId } from '../../redux/selectors';
import { VariancePopupData } from '../../redux/state/AppState';
import { AnalysisState, AnalysisType } from '../analysis/ColumnAnalysisState';
import { dataLoader } from '../analysis/columnAnalysisUtils';
import TextEnterFilter from '../analysis/filters/TextEnterFilter';

/** Component properties of VarianceChart */
interface VarianceChartProps {
  height: number;
  filtered: boolean;
}

const selectResult = createSelector([selectDataId, selectChartData], (dataId, chartData) => ({
  dataId,
  chartData: chartData as VariancePopupData,
}));

const VarianceChart: React.FC<VarianceChartProps & WithTranslation> = ({ height = 400, filtered, t }) => {
  const { dataId, chartData } = useAppSelector(selectResult);
  const [bins, setBins] = React.useState(20);
  const [error, setError] = React.useState<JSX.Element>();
  const [chart, setChart] = React.useState<JSX.Element>();

  const createChart = async (): Promise<void> => {
    const propagateState = (state: Partial<AnalysisState>): void => {
      setChart(state.hasOwnProperty('chart') ? state.chart : chart);
      setError(state.hasOwnProperty('error') ? state.error : error);
    };
    await dataLoader(
      { dataId, chartData, height, filtered },
      { chart, error, type: AnalysisType.HISTOGRAM },
      propagateState,
      undefined,
      undefined,
      { type: AnalysisType.HISTOGRAM, bins },
    );
  };

  React.useEffect(() => {
    createChart();
  }, []);

  // shouldComponentUpdate(newProps, newState) {
  //   if (!_.isEqual(this.props, newProps)) {
  //     return true;
  //   }
  //   const updateState = ['error', 'bins', 'chart'];
  //   if (!_.isEqual(_.pick(this.state, updateState), _.pick(newState, updateState))) {
  //     return true;
  //   }
  //   return false;
  // }

  // componentDidUpdate(prevProps) {
  //   if (!_.isEqual(this.props, prevProps)) {
  //     this.createChart();
  //   }
  // }

  return (
    <React.Fragment>
      <div className="form-group row small-gutters mb-3 mt-3">
        <div className="col row">
          <div style={{ fontSize: 16 }} className="col font-weight-bold m-auto">
            {t('HISTOGRAM')}
          </div>
          <TextEnterFilter
            {...{
              prop: 'bins',
              buildChart: createChart,
              dtype: 'float64',
              propagateState: (state: { value: string }) => setBins(Number(state.value)),
              defaultValue: `${bins}`,
            }}
          />
          <div className="col" />
        </div>
      </div>
      {error}
      {chart}
    </React.Fragment>
  );
};

export default withTranslation('variance')(VarianceChart);
