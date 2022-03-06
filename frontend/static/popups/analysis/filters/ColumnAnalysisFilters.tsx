import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import ButtonToggle from '../../../ButtonToggle';
import { ColumnDef } from '../../../dtale/DataViewerState';
import * as gu from '../../../dtale/gridUtils';
import { BaseOption } from '../../../redux/state/AppState';
import { renderCodePopupAnchor } from '../../CodePopup';
import { AnalysisParams, AnalysisType } from '../ColumnAnalysisState';

import CategoryInputs from './CategoryInputs';
import { analysisAggs, titles } from './Constants';
import { default as GeoFilters, hasCoords, loadCoordVals } from './GeoFilters';
import OrdinalInputs from './OrdinalInputs';
import TextEnterFilter from './TextEnterFilter';

/** Component properties for ColumnAnalysisFilters */
export interface ColumnAnalysisFiltersProps {
  selectedCol: string;
  cols?: ColumnDef[];
  dtype?: string;
  code?: string;
  type: AnalysisType;
  top?: number;
  buildChart: (currentParams?: AnalysisParams) => Promise<void>;
}

const ColumnAnalysisFilters: React.FC<ColumnAnalysisFiltersProps & WithTranslation> = ({
  selectedCol,
  cols,
  dtype,
  code,
  t,
  ...props
}) => {
  const aggOptions = analysisAggs(t);
  const coordVals = loadCoordVals(selectedCol, cols ?? []);

  const [type, setType] = React.useState<AnalysisType>(props.type);
  const [bins, setBins] = React.useState<string>('20');
  const [top, setTop] = React.useState<string>(`${props.top ?? 100}`);
  const [ordinalCol, setOrdinalCol] = React.useState<BaseOption<string>>();
  const [ordinalAgg, setOrdinalAgg] = React.useState<BaseOption<string>>(
    aggOptions.find((agg) => agg.value === 'sum')!,
  );
  const [cleaners, setCleaners] = React.useState<Array<{ value: string }>>([]);
  const [categoryCol, setCategoryCol] = React.useState<BaseOption<string>>();
  const [categoryAgg, setCategoryAgg] = React.useState<BaseOption<string>>(
    aggOptions.find((agg) => agg.value === 'mean')!,
  );
  const [latCol, setLatCol] = React.useState<BaseOption<string> | undefined>(coordVals.latCol);
  const [lonCol, setLonCol] = React.useState<BaseOption<string> | undefined>(coordVals.lonCol);

  React.useEffect(() => {
    setTop(`${props.top ?? 100}`);
  }, [props.top]);

  const buildChart = async (): Promise<void> => {
    await props.buildChart({
      type,
      top: top ? parseInt(top, 10) : undefined,
      bins: bins ? parseInt(bins, 10) : undefined,
      ordinalCol,
      ordinalAgg,
      cleaners,
      categoryCol,
      categoryAgg,
      latCol,
      lonCol,
    });
  };

  React.useEffect(() => {
    buildChart();
  }, [cols, code, dtype, type, top, bins, ordinalCol, ordinalAgg, categoryCol, categoryAgg, latCol, lonCol]);

  const buildChartTypeToggle = (): JSX.Element => {
    const colType = gu.findColType(dtype);
    const translatedTitles = titles(t);
    let options = [{ label: translatedTitles.histogram, value: AnalysisType.HISTOGRAM }];
    if (colType === gu.ColumnType.STRING) {
      options = [
        { label: translatedTitles.value_counts, value: AnalysisType.VALUE_COUNTS },
        {
          label: translatedTitles.word_value_counts,
          value: AnalysisType.WORD_VALUE_COUNTS,
        },
      ];
    } else if (colType === gu.ColumnType.FLOAT) {
      options.push({ label: translatedTitles.categories, value: AnalysisType.CATEGORIES });
    } else {
      options.push({
        label: translatedTitles.value_counts,
        value: AnalysisType.VALUE_COUNTS,
      });
    }
    if (hasCoords(selectedCol, cols ?? [])) {
      options.push({
        label: translatedTitles.geolocation,
        value: AnalysisType.GEOLOCATION,
      });
    }
    if (colType !== gu.ColumnType.STRING) {
      options.push({ label: translatedTitles.qq, value: AnalysisType.QQ });
    }
    const update = (value?: AnalysisType): (() => Promise<void>) => {
      setType(value!);
      setTop('');
      return () => buildChart();
    };
    return <ButtonToggle options={options} update={update} defaultValue={type} />;
  };

  const buildFilter = (setter: (value: string) => void, defaultValue?: string): JSX.Element => {
    return (
      <TextEnterFilter
        {...{
          prop: 'value',
          buildChart,
          dtype,
          propagateState: (state: { value: string }) => setter(state.value),
          defaultValue,
        }}
      />
    );
  };

  const buildFilterMarkup = (): React.ReactNode => {
    const colType = gu.findColType(dtype);
    if (type === AnalysisType.GEOLOCATION) {
      return <GeoFilters col={selectedCol} columns={cols ?? []} {...{ latCol, lonCol, setLatCol, setLonCol }} />;
    } else if (type === AnalysisType.QQ) {
      return null;
    } else if (colType === gu.ColumnType.INT) {
      // int -> Value Counts or Histogram
      if (type === AnalysisType.HISTOGRAM) {
        return buildFilter(setBins, bins);
      } else {
        return (
          <React.Fragment>
            {buildFilter(setTop, top)}
            <OrdinalInputs
              {...{ colType, selectedCol, cols: cols ?? [], type, setOrdinalCol, setOrdinalAgg, setCleaners }}
            />
          </React.Fragment>
        );
      }
    } else if (colType === gu.ColumnType.FLOAT) {
      // floats -> Histogram or Categories
      if (type === AnalysisType.HISTOGRAM) {
        return buildFilter(setBins, bins);
      } else {
        return (
          <React.Fragment>
            {buildFilter(setTop, top)}
            <CategoryInputs {...{ selectedCol, cols: cols ?? [], setCategoryCol, setCategoryAgg }} />
          </React.Fragment>
        );
      }
    } else if (type === AnalysisType.HISTOGRAM) {
      return buildFilter(setBins, bins);
    } else {
      // date, string, bool -> Value Counts
      return (
        <React.Fragment>
          {buildFilter(setTop, top)}
          <OrdinalInputs
            {...{ colType, selectedCol, cols: cols ?? [], type, setOrdinalCol, setOrdinalAgg, setCleaners }}
          />
        </React.Fragment>
      );
    }
  };

  if (!type) {
    return null;
  }

  return (
    <React.Fragment>
      <div className="form-group row small-gutters mb-4">
        <div className="col type-toggle">{buildChartTypeToggle()}</div>
        <div className="col-auto">
          <div>
            {code && renderCodePopupAnchor(code, t(type === AnalysisType.HISTOGRAM ? 'Histogram' : 'Value Counts'))}
          </div>
        </div>
      </div>
      <div className="form-group row small-gutters mb-0">{buildFilterMarkup()}</div>
    </React.Fragment>
  );
};

export default withTranslation('constants')(ColumnAnalysisFilters);
