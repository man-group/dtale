import * as React from 'react';
import { useSelector } from 'react-redux';

import { ChartObj } from '../../chartUtils';
import { ColumnDef } from '../../dtale/DataViewerState';
import { AppState } from '../../redux/state/AppState';
import { AnalysisParams, AnalysisState, AnalysisType } from '../analysis/ColumnAnalysisState';
import { dataLoader } from '../analysis/columnAnalysisUtils';
import DescribeFilters from '../analysis/filters/DescribeFilters';

import { DetailData, WordValueState } from './DescribeState';
import DetailsBoxplot from './DetailsBoxplot';

/** Component properties for DetailsCharts */
interface DetailsChartsProps {
  details: DetailData;
  detailCode?: string;
  cols: ColumnDef[];
  dtype: string;
  col: string;
  propagateState: (state: WordValueState) => void;
  filtered: boolean;
}

export const DetailsCharts: React.FC<DetailsChartsProps> = ({ details, detailCode, col, filtered, ...props }) => {
  const dataId = useSelector((state: AppState) => state.dataId);

  const [cols, setCols] = React.useState([...props.cols]);
  const [dtype, setDtype] = React.useState(props.dtype);
  const [type, setType] = React.useState(AnalysisType.BOXPLOT);
  const [chart, setChart] = React.useState<JSX.Element>();
  const [code, setCode] = React.useState<string>();
  const [query, setQuery] = React.useState<string>();
  const [error, setError] = React.useState<JSX.Element>();
  const [chartParams, setChartParams] = React.useState<AnalysisState>();
  const [top, setTop] = React.useState<number>();
  const chartRef = React.useRef<ChartObj>();

  const buildChart = async (currentParams?: AnalysisParams): Promise<void> => {
    const finalParams = currentParams || chartParams;
    if (finalParams?.type === AnalysisType.BOXPLOT) {
      setChart(<DetailsBoxplot details={details} column={col} />);
      setCode(detailCode);
      setQuery(undefined);
      setError(undefined);
      props.propagateState({ viewWordValues: false });
    } else {
      const propagateState = (state: Partial<AnalysisState>): void => {
        setChart(state.chart);
        setCode(state.code);
        setError(state.error);
        setCols(state.hasOwnProperty('cols') ? state.cols ?? [] : cols);
        setQuery(state.hasOwnProperty('query') ? state.query : query);
        setType(state.hasOwnProperty('type') ? state.type! : type);
        setDtype(state.hasOwnProperty('dtype') ? state.dtype! : dtype);
        setChartParams(state.hasOwnProperty('chartParams') ? state.chartParams : chartParams);
        setTop(state.hasOwnProperty('top') ? state.top : top);
        const proppedState: WordValueState = { viewWordValues: state.type === AnalysisType.WORD_VALUE_COUNTS };
        if (state.wordValues !== undefined) {
          proppedState.wordValues = state.wordValues;
        }
        props.propagateState(proppedState);
      };
      await dataLoader(
        { chartData: { selectedCol: col }, height: 400, dataId, filtered },
        { chartParams: { type, ...chartParams }, type },
        propagateState,
        chartRef,
        (chartObj?: ChartObj) => (chartRef.current = chartObj),
        finalParams,
      );
    }
  };

  React.useEffect(() => {
    buildChart({ type });
  }, []);

  React.useEffect(() => {
    setDtype(props.dtype);
  }, [col]);

  return (
    <div data-testid="details-charts">
      {error}
      <div className="row">
        <div data-testid="describe-filters" className="col-md-12">
          <DescribeFilters
            {...{ type, cols, dtype, code, top }}
            selectedCol={col}
            buildChart={buildChart}
            details={details}
          />
        </div>
      </div>
      {chart}
    </div>
  );
};
