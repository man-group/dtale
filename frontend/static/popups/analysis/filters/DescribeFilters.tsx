import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import ButtonToggle from '../../../ButtonToggle';
import { ColumnDef } from '../../../dtale/DataViewerState';
import * as gu from '../../../dtale/gridUtils';
import { DetailData } from '../../../popups/describe/DescribeState';
import { BaseOption } from '../../../redux/state/AppState';
import { renderCodePopupAnchor } from '../../CodePopup';
import { AnalysisParams, AnalysisType } from '../ColumnAnalysisState';

import CategoryInputs from './CategoryInputs';
import { analysisAggs, sortOptions, titles } from './Constants';
import FilterSelect from './FilterSelect';
import { default as GeoFilters, hasCoords, loadCoordVals } from './GeoFilters';
import OrdinalInputs from './OrdinalInputs';
import TextEnterFilter from './TextEnterFilter';

const wrapFilterMarkup = (filterMarkup: JSX.Element): JSX.Element => (
  <div className="form-group row small-gutters mb-3 mt-3">
    <div className="row m-0">{filterMarkup}</div>
  </div>
);

/** Component properties for DescribeFilters */
export interface DescribeFiltersProps {
  selectedCol: string;
  cols: ColumnDef[];
  dtype: string;
  code?: string;
  type?: AnalysisType;
  top?: number;
  buildChart: (currentParams?: AnalysisParams) => Promise<void>;
  details: DetailData;
}

const DescribeFilters: React.FC<DescribeFiltersProps & WithTranslation> = ({
  code,
  details,
  dtype,
  cols,
  selectedCol,
  t,
  ...props
}) => {
  const aggOptions = React.useMemo(() => analysisAggs(t), [t]);
  const coordVals = React.useMemo(() => loadCoordVals(selectedCol, cols ?? []), [selectedCol, cols]);
  const chartOpts = React.useMemo(() => {
    const colType = gu.findColType(dtype);
    const translatedTitles = titles(t);
    const options = [{ label: translatedTitles.boxplot, value: AnalysisType.BOXPLOT }];
    const isFid = [gu.ColumnType.FLOAT, gu.ColumnType.INT, gu.ColumnType.DATE].includes(colType);
    if (isFid) {
      options.push({ label: translatedTitles.histogram, value: AnalysisType.HISTOGRAM });
    }
    if (colType === gu.ColumnType.FLOAT) {
      options.push({ label: translatedTitles.categories, value: AnalysisType.CATEGORIES });
    } else if (colType === gu.ColumnType.STRING) {
      options.push({
        label: translatedTitles.word_value_counts,
        value: AnalysisType.WORD_VALUE_COUNTS,
      });
      options.push({
        label: translatedTitles.value_counts,
        value: AnalysisType.VALUE_COUNTS,
      });
    } else {
      options.push({
        label: translatedTitles.value_counts,
        value: AnalysisType.VALUE_COUNTS,
      });
    }
    if (hasCoords(selectedCol, cols)) {
      options.push({
        label: translatedTitles.geolocation,
        value: AnalysisType.GEOLOCATION,
      });
    }
    if (isFid) {
      options.push({ label: translatedTitles.qq, value: AnalysisType.QQ });
    }
    return options;
  }, [dtype, cols, selectedCol, t]);
  const colOptions: Array<BaseOption<string>> = React.useMemo(
    () =>
      cols
        .filter((c) => c.name !== selectedCol)
        .map((c) => ({ value: c.name }))
        .sort(sortOptions),
    [cols, selectedCol],
  );

  const [type, setType] = React.useState<AnalysisType>(props.type ?? AnalysisType.BOXPLOT);
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
  const [density, setDensity] = React.useState<boolean>(false);
  const [target, setTarget] = React.useState<BaseOption<string>>();

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
      density,
      target,
    });
  };

  React.useEffect(() => {
    const prevChartExists = chartOpts.find((opt) => opt.value === type) !== undefined;
    if (!prevChartExists) {
      setType(AnalysisType.BOXPLOT);
      setLatCol(coordVals.latCol);
      setLonCol(coordVals.lonCol);
      return;
    }
    if (coordVals.latCol !== latCol || coordVals.lonCol !== lonCol) {
      setLatCol(coordVals.latCol);
      setLonCol(coordVals.lonCol);
      return;
    }

    buildChart();
  }, [selectedCol, details]);

  React.useEffect(() => {
    buildChart();
  }, [type, top, bins, ordinalCol, ordinalAgg, categoryCol, categoryAgg, latCol, lonCol, density, target]);

  React.useEffect(() => {
    const keyPress = (e: KeyboardEvent): void => {
      if (e.key === 'ArrowLeft') {
        const selectedIndex = chartOpts.findIndex((option) => option.value === type);
        if (selectedIndex > 0) {
          setType(chartOpts[selectedIndex - 1].value);
          e?.stopPropagation();
          return;
        }
      } else if (e.key === 'ArrowRight') {
        const selectedIndex = chartOpts.findIndex((option) => option.value === type);
        if (selectedIndex < chartOpts.length - 1) {
          setType(chartOpts[selectedIndex + 1].value);
          e?.stopPropagation();
          return;
        }
      }
    };
    document.addEventListener('keydown', keyPress);
    return () => document.removeEventListener('keydown', keyPress);
  }, [chartOpts, type]);

  const buildChartTypeToggle = (): JSX.Element => {
    return (
      <React.Fragment>
        <ButtonToggle options={chartOpts} update={(value?: AnalysisType) => setType(value!)} defaultValue={type} />
        <small className="d-block pl-4 pt-3">({t('constants:navigate')})</small>
      </React.Fragment>
    );
  };

  const buildFilter = (setter: (value: string) => void, defaultValue?: string, disabled = false): JSX.Element => {
    return (
      <TextEnterFilter
        {...{
          prop: 'value',
          buildChart,
          dtype,
          propagateState: (state: { value: string }) => setter(state.value),
          defaultValue,
          disabled,
        }}
      />
    );
  };

  const targetSelect = (): JSX.Element => (
    <React.Fragment key="target">
      <div className="col-auto text-center pr-4">
        <div>
          <b>{t('Target')}</b>
        </div>
        <div style={{ marginTop: '-.5em' }}>
          <small>{`(${t('Choose Col')})`}</small>
        </div>
      </div>
      <div className="col-auto pl-0 mr-3 ordinal-dd">
        <FilterSelect
          value={target}
          options={colOptions}
          onChange={(value?: BaseOption<string> | Array<BaseOption<string>>) =>
            setTarget((value as BaseOption<string>) ?? undefined)
          }
          noOptionsMessage={() => t('No columns found')}
          isClearable={true}
        />
      </div>
    </React.Fragment>
  );

  const densityToggle = (): JSX.Element => (
    <ButtonToggle
      options={[
        { label: 'Frequency', value: false },
        { label: 'Probability', value: true },
      ]}
      update={(value?: boolean) => setDensity(value!)}
      defaultValue={density}
      className="pr-0"
    />
  );

  const buildFilterMarkup = (): React.ReactNode => {
    const colType = gu.findColType(dtype);
    if (type === AnalysisType.BOXPLOT || type === AnalysisType.QQ) {
      return null;
    } else if (type === AnalysisType.GEOLOCATION) {
      return wrapFilterMarkup(
        <GeoFilters col={selectedCol} columns={cols ?? []} {...{ latCol, lonCol, setLatCol, setLonCol }} />,
      );
    } else if (colType === gu.ColumnType.INT) {
      // int -> Value Counts or Histogram
      if (type === AnalysisType.HISTOGRAM) {
        return wrapFilterMarkup(
          <React.Fragment>
            {densityToggle()}
            {!density && buildFilter(setBins, bins)}
            {targetSelect()}
          </React.Fragment>,
        );
      } else {
        return wrapFilterMarkup(
          <React.Fragment>
            {buildFilter(setTop, top)}
            <OrdinalInputs
              {...{ colType, selectedCol, cols: cols ?? [], type, setOrdinalCol, setOrdinalAgg, setCleaners }}
            />
          </React.Fragment>,
        );
      }
    } else if (colType === gu.ColumnType.FLOAT) {
      // floats -> Histogram or Categories
      if (type === AnalysisType.HISTOGRAM) {
        return wrapFilterMarkup(
          <React.Fragment>
            {densityToggle()}
            {!density && buildFilter(setBins, bins)}
            {targetSelect()}
          </React.Fragment>,
        );
      } else {
        return wrapFilterMarkup(
          <React.Fragment>
            {buildFilter(setTop, top)}
            <CategoryInputs {...{ selectedCol, cols: cols ?? [], setCategoryCol, setCategoryAgg }} />
          </React.Fragment>,
        );
      }
    } else {
      // date, string, bool -> Value Counts
      return wrapFilterMarkup(
        <React.Fragment>
          {buildFilter(setTop, top)}
          {type !== AnalysisType.HISTOGRAM && (
            <OrdinalInputs
              {...{ colType, selectedCol, cols: cols ?? [], type, setOrdinalCol, setOrdinalAgg, setCleaners }}
            />
          )}
          {type === AnalysisType.HISTOGRAM && densityToggle()}
        </React.Fragment>,
      );
    }
  };

  if (!props.type) {
    return null;
  }

  return (
    <React.Fragment>
      <div className="form-group row small-gutters mb-5 mt-3">
        <div className="col p-0 type-toggle">{buildChartTypeToggle()}</div>
        <div className="col-auto">
          <div>{code && renderCodePopupAnchor(code, titles(t)[type])}</div>
        </div>
      </div>
      {buildFilterMarkup()}
    </React.Fragment>
  );
};

export default withTranslation('constants')(DescribeFilters);
