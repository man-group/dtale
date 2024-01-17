import { createSelector } from '@reduxjs/toolkit';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { createFilter, default as Select } from 'react-select';

import { ColumnDef } from '../../dtale/DataViewerState';
import { useAppSelector } from '../../redux/hooks';
import { selectChartData, selectDataId } from '../../redux/selectors';
import { BaseOption, ChartsPopupData } from '../../redux/state/AppState';
import { RemovableError } from '../../RemovableError';
import * as ChartsRepository from '../../repository/ChartsRepository';
import * as DtypesRepository from '../../repository/DtypesRepository';
import { constructColumnOptionsFilteredByOtherValues } from '../create/ColumnSelect';

import Aggregations from './Aggregations';
import ChartsBody from './ChartsBody';

require('./Charts.css');

/** State properties for Charts */
export interface ChartsState {
  x?: BaseOption<string>;
  y: Array<BaseOption<string>>;
  group?: Array<BaseOption<string>>;
  aggregation?: string;
  rollingComputation?: string;
  rollingWindow?: string;
}

const selectResult = createSelector([selectDataId, selectChartData], (dataId, chartData) => ({
  chartData: chartData as ChartsPopupData,
  dataId,
}));

const Charts: React.FC<WithTranslation> = ({ t }) => {
  const { chartData, dataId } = useAppSelector(selectResult);
  const [columns, setColumns] = React.useState<ColumnDef[]>();
  const [state, setState] = React.useState<ChartsState>({
    x: chartData.x ? { value: chartData.x } : undefined,
    y: (chartData.y ?? []).map((y2) => ({ value: y2 })),
    group: (chartData.group ?? []).map((g) => ({ value: g })),
    rollingWindow: '4',
  });
  const [url, setUrl] = React.useState<string>();
  const [query, setQuery] = React.useState<string | undefined>(chartData.query);
  const [error, setError] = React.useState<JSX.Element>();

  const generateChartState = (): void => {
    const { x, y, group, aggregation, rollingWindow, rollingComputation } = state;
    if (!x || !y.length) {
      setUrl(undefined);
      return;
    }
    const params: Record<string, string> = {
      x: x.value,
      y: JSON.stringify(y.map(({ value }) => value)),
      query: query ?? '',
    };
    if (!!group?.length) {
      params.group = JSON.stringify(group.map(({ value }) => value));
    }
    if (aggregation) {
      params.agg = aggregation;
      if (aggregation === 'rolling') {
        if (rollingWindow && parseInt(rollingWindow, 10)) {
          params.rollingWin = `${parseInt(rollingWindow, 10)}`;
        } else {
          setUrl(undefined);
          setError(<RemovableError error={t('Aggregation (rolling) requires a window')} />);
          return;
        }
        if (rollingComputation) {
          params.rollingComp = rollingComputation;
        } else {
          setUrl(undefined);
          setError(<RemovableError error={t('Aggregation (rolling) requires a computation')} />);
          return;
        }
      }
    }
    setUrl(ChartsRepository.buildUrl(dataId, params));
  };

  React.useEffect(() => {
    (async () => {
      const response = await DtypesRepository.loadDtypes(dataId);
      if (response?.error) {
        setError(<RemovableError {...response} />);
        return;
      }
      setColumns(response?.dtypes);
    })();
  }, []);

  React.useEffect(() => {
    generateChartState();
  }, [columns, state]);

  const renderSelect = (
    label: string,
    prop: string,
    value?: BaseOption<string> | Array<BaseOption<string>>,
    otherProps: Array<BaseOption<string> | Array<BaseOption<string>> | undefined> = [],
    isMulti = false,
  ): JSX.Element => {
    const finalOptions = constructColumnOptionsFilteredByOtherValues(columns ?? [], otherProps);
    return (
      <div className="input-group mr-3">
        <span className="input-group-addon">{t(label)}</span>
        <Select
          isMulti={isMulti}
          className="Select is-clearable is-searchable Select--single"
          classNamePrefix="Select"
          options={finalOptions}
          getOptionLabel={(option) => option.value}
          getOptionValue={(option) => option.value}
          value={value}
          onChange={(selection) => {
            if (isMulti) {
              setState({ ...state, [prop]: (selection as Array<BaseOption<string>>) ?? undefined });
            } else {
              setState({ ...state, [prop]: (selection as BaseOption<string>) ?? undefined });
            }
          }}
          isClearable={true}
          filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
        />
      </div>
    );
  };

  return (
    <div className="charts-body">
      {error}
      <div className="row pt-3 pb-3 charts-filters">
        <div className="col">
          <div className="input-group">
            <span className="input-group-addon">{t('Query')}</span>
            <input
              className="form-control input-sm"
              type="text"
              value={query || ''}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="row pt-3 pb-3 charts-filters">
        <div className="col-auto">{renderSelect('X', 'x', state.x, [state.y, state.group])}</div>
        <div className="col">{renderSelect('Y', 'y', state.y, [state.x, state.group], true)}</div>
        <div className="col">{renderSelect('Group', 'group', state.group, [state.x, state.y], true)}</div>
      </div>
      <div className="row pt-3 pb-3 charts-filters">
        <Aggregations
          propagateState={(aggregations) => setState({ ...state, ...aggregations })}
          aggregation={state.aggregation}
          x={state.x}
          group={state.group}
          columns={columns ?? []}
        />
        <div className="col-auto">
          <button className="btn btn-primary float-right" onClick={generateChartState}>
            <span>{t('Load')}</span>
          </button>
        </div>
      </div>
      <ChartsBody
        {...state}
        columns={columns ?? []}
        url={url}
        height={450}
        chartType={chartData.chartType}
        chartPerGroup={chartData.chartPerGroup}
        visible={chartData.visible}
      />
    </div>
  );
};

export default withTranslation('charts')(Charts);
