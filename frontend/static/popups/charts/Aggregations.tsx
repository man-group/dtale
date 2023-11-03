import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { createFilter, default as Select } from 'react-select';

import { ColumnDef } from '../../dtale/DataViewerState';
import * as gu from '../../dtale/gridUtils';
import { BaseOption } from '../../redux/state/AppState';
import { aggregationOpts, rollingComps } from '../analysis/filters/Constants';

/** State properties for Aggregations */
interface AggregationsState {
  aggregation: string;
  rollingComputation: string;
  rollingWindow: string;
}

/** Component properties for Aggregations */
interface AggregationsProps {
  aggregation?: string;
  propagateState: (state: Partial<AggregationsState>) => void;
  columns: ColumnDef[];
  x?: BaseOption<string>;
  group?: Array<BaseOption<string>>;
}

const Aggregations: React.FC<AggregationsProps & WithTranslation> = ({
  columns,
  x,
  group,
  propagateState,
  t,
  ...props
}) => {
  const aggregationOptions = React.useMemo(() => {
    const allOptions = aggregationOpts(t);
    if (gu.isDateCol(gu.getDtype(x?.value, columns)) && group?.length) {
      return allOptions;
    }
    return allOptions.filter((option) => option.value !== 'rolling');
  }, [columns, x, group, t]);
  const rollingOptions = React.useMemo(() => rollingComps(t), [t]);

  const [aggregation, setAggregation] = React.useState<BaseOption<string> | undefined>(
    aggregationOptions.find((option) => option.value === props.aggregation),
  );
  const [rollingComputation, setRollingComputation] = React.useState<BaseOption<string>>();
  const [rollingWindow, setRollingWindow] = React.useState<string>('4');

  const renderRolling = (): JSX.Element => {
    if (aggregation?.value === 'rolling') {
      return (
        <React.Fragment>
          <div className="col-auto">
            <div className="input-group">
              <span className="input-group-addon">{t('charts:Window')}</span>
              <input
                style={{ width: '3em' }}
                className="form-control text-center"
                type="text"
                value={rollingWindow || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
                  setRollingWindow(e.target.value ?? '');
                  propagateState({ rollingWindow: e.target.value ?? '' });
                }}
              />
            </div>
          </div>
          <div className="col-auto">
            <div className="input-group mr-3">
              <span className="input-group-addon">{t('charts:Computation')}</span>
              <Select
                className="Select is-clearable is-searchable Select--single"
                classNamePrefix="Select"
                options={rollingOptions}
                getOptionLabel={(option) => option?.label ?? option.value}
                getOptionValue={(option) => option.value}
                value={rollingComputation ?? null}
                onChange={(value): void => {
                  setRollingComputation(value ?? undefined);
                  propagateState({ rollingComputation: value?.value ?? undefined });
                }}
                isClearable={true}
                filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
              />
            </div>
          </div>
          <div className="col" />
        </React.Fragment>
      );
    }
    return <div className="col" />;
  };

  return (
    <React.Fragment>
      <div className="col-auto">
        <div className="input-group mr-3">
          <span className="input-group-addon">{t('charts:Aggregation')}</span>
          <Select
            className="Select is-clearable is-searchable Select--single"
            classNamePrefix="Select"
            options={aggregationOptions}
            getOptionLabel={(option) => option?.label ?? option.value}
            getOptionValue={(option) => option.value}
            value={aggregation}
            onChange={(value): void => {
              setAggregation(value ?? undefined);
              propagateState({ aggregation: value?.value ?? undefined });
            }}
            isClearable={true}
            filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
          />
        </div>
      </div>
      {renderRolling()}
    </React.Fragment>
  );
};

export default withTranslation(['constants', 'charts'])(Aggregations);
