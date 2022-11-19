import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { isIntCol } from '../../../dtale/gridUtils';
import { capitalize } from '../../../stringUtils';
import { AnalysisParams } from '../ColumnAnalysisState';

/** Component properties for TextEnterFilter */
interface TextEnterFilterProps {
  prop: string;
  dtype?: string;
  propagateState: (state: { value: string }) => void;
  buildChart: (currentParams?: AnalysisParams) => Promise<void>;
  defaultValue?: string;
  disabled?: boolean;
}

const TextEnterFilter: React.FC<TextEnterFilterProps & WithTranslation> = ({
  dtype,
  disabled,
  defaultValue,
  prop,
  propagateState,
  buildChart,
  t,
}) => {
  const [value, setValue] = React.useState<string | undefined>(defaultValue);

  React.useEffect(() => {
    if (defaultValue !== value) {
      setValue(defaultValue);
    }
  }, [defaultValue]);

  const updateValue = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setValue(event.target.value);
    propagateState({ value: event.target.value });
  };

  const updateFilter = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      if (value && parseInt(value, 10)) {
        buildChart();
      }
      e.preventDefault();
    }
  };

  return (
    <React.Fragment>
      <div className={`col-auto text-center pr-4 ${isIntCol(dtype) ? 'pl-0' : ''}`}>
        <div>
          <b>{t(capitalize(prop))}</b>
        </div>
        <div style={{ marginTop: '-.5em' }}>
          <small>{`(${t('Please edit')})`}</small>
        </div>
      </div>
      <div style={{ width: '3em' }} data-tip={t('Press ENTER to submit')}>
        <input
          type="text"
          className="form-control text-center column-analysis-filter"
          value={value ?? ''}
          onChange={updateValue}
          onKeyDown={updateFilter}
          disabled={disabled ?? false}
          data-testid={`${prop}-input`}
        />
      </div>
    </React.Fragment>
  );
};

export default withTranslation('text_enter')(TextEnterFilter);
