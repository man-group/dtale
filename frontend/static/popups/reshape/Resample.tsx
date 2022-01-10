import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { createFilter, default as Select } from 'react-select';

import { BaseOption } from '../../redux/state/AppState';
import { resampleAggs as buildResampleAggs } from '../analysis/filters/Constants';
import { CreateColumnCodeSnippet } from '../create/CodeSnippet';
import ColumnSelect from '../create/ColumnSelect';
import { BaseCreateComponentProps, ResampleConfig, SaveAs } from '../create/CreateColumnState';

const OFFSET_URL = 'https://pandas.pydata.org/pandas-docs/stable/user_guide/timeseries.html#offset-aliases';

export const validateResampleCfg = (cfg: ResampleConfig): string | undefined => {
  if (!cfg.index) {
    return 'Missing an index selection!';
  }
  if (!cfg.freq) {
    return 'Missing offset!';
  }
  if (!cfg.agg) {
    return 'Missing aggregation!';
  }
  return undefined;
};

export const buildCode = (cfg: ResampleConfig): CreateColumnCodeSnippet => {
  if (!cfg.index) {
    return undefined;
  }
  if (!cfg.freq) {
    return undefined;
  }
  if (!cfg.agg) {
    return undefined;
  }
  let code = `df.set_index(['${cfg.index}'])`;
  if (cfg.columns?.length) {
    code += `[['${cfg.columns.join("', '")}']]`;
  }
  code += `.resample('${cfg.freq}').${cfg.agg}()`;
  return code;
};

const Resample: React.FC<BaseCreateComponentProps & WithTranslation> = ({
  namePopulated,
  updateState,
  t,
  ...props
}) => {
  const resampleAggs = React.useMemo(() => buildResampleAggs(t), [t]);
  const [index, setIndex] = React.useState<BaseOption<string>>();
  const [columns, setColumns] = React.useState<Array<BaseOption<string>>>();
  const [freq, setFreq] = React.useState('');
  const [agg, setAgg] = React.useState<BaseOption<string>>();

  React.useEffect(() => {
    const cfg: ResampleConfig = {
      index: index?.value,
      columns: columns?.map(({ value }) => value),
      freq,
      agg: agg?.value,
    };
    updateState({ cfg, code: buildCode(cfg), saveAs: SaveAs.NONE });
  }, [index, columns, freq, agg]);

  return (
    <React.Fragment>
      <ColumnSelect
        label={t('reshape:Index')}
        prop="index"
        parent={{ index }}
        updateState={(updates: { index?: BaseOption<string> }) => setIndex(updates.index)}
        columns={props.columns}
        dtypes={['date']}
      />
      <ColumnSelect
        label={t('reshape:Columns')}
        prop="columns"
        parent={{ columns }}
        updateState={(updates: { columns?: Array<BaseOption<string>> }) => setColumns(updates.columns)}
        columns={props.columns}
        dtypes={['int', 'float']}
        isMulti={true}
      />
      <div className="form-group row">
        <label className="col-md-3 col-form-label text-right">{t('reshape:Offset')}</label>
        <div className="col-md-8">
          <input type="text" className="form-control" value={freq} onChange={(e) => setFreq(e.target.value)} />
          <small>
            {t('Examples of pandas offset aliases found ')}
            <a href={OFFSET_URL} rel="noopener noreferrer" target="_blank">
              here
            </a>
          </small>
        </div>
      </div>
      <div className="form-group row">
        <label className="col-md-3 col-form-label text-right">{t('reshape:Aggregation')}</label>
        <div className="col-md-8">
          <div className="input-group">
            <Select
              className="Select is-clearable is-searchable Select--single"
              classNamePrefix="Select"
              options={resampleAggs}
              getOptionLabel={(o) => o.label ?? o.value}
              getOptionValue={(o) => o.value}
              value={agg}
              onChange={(value) => setAgg(value ?? undefined)}
              isClearable={false}
              filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
            />
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default withTranslation(['reshape', 'constants'])(Resample);
