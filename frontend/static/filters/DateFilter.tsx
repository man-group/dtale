import { DateInput, DateInputProps } from '@blueprintjs/datetime';
import moment from 'moment';
import React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { BaseColumnFilterProps } from './ColumnFilterState';

require('@blueprintjs/core/lib/css/blueprint.css');
require('@blueprintjs/datetime/lib/css/blueprint-datetime.css');

/** Component properties for DateFilter */
interface DateFilterProps extends BaseColumnFilterProps {
  min: string;
  max: string;
}

export const DateFilter: React.FC<DateFilterProps & WithTranslation> = ({
  selectedCol,
  columnFilter,
  updateState,
  missing,
  min,
  max,
  t,
}) => {
  const minimum = min ? moment(min).toDate() : undefined;
  const initialStart = columnFilter?.start ?? min;
  const maximum = max ? moment(max).toDate() : undefined;
  const initialEnd = columnFilter?.end ?? max;
  const [start, setStart] = React.useState<Date | undefined>(initialStart ? moment(initialStart).toDate() : undefined);
  const [end, setEnd] = React.useState<Date | undefined>(initialEnd ? moment(initialEnd).toDate() : undefined);
  const [triggerSave, setTriggerSave] = React.useState<boolean>(false);

  const startInput = React.useRef<HTMLInputElement>(null);
  const endInput = React.useRef<HTMLInputElement>(null);

  const updateDate = (inputRef: React.RefObject<HTMLInputElement>, value: Date, setter: (v: Date) => void): void => {
    const inputRefValue = inputRef.current?.value ?? '';
    if (inputRefValue?.length > 0 && inputRefValue.length < 8) {
      return;
    }
    setter(value);
  };

  const save = async (): Promise<void> => {
    const cfgStart = start ? moment(start).format('YYYYMMDD') : undefined;
    const cfgEnd = end ? moment(end).format('YYYYMMDD') : undefined;
    if (cfgStart || cfgEnd) {
      updateState({ type: 'date', start: cfgStart, end: cfgEnd });
    } else {
      updateState(undefined);
    }
  };

  React.useEffect(() => {
    if (triggerSave) {
      save();
      setTriggerSave(false);
    }
  }, [triggerSave]);

  const inputProps: Partial<DateInputProps> = {
    formatDate: (date) => moment(date).format('YYYYMMDD'),
    parseDate: (str: string) => moment(str).toDate(),
    placeholder: 'YYYYMMDD',
    popoverProps: { usePortal: false },
    minDate: minimum,
    maxDate: maximum,
    showActionsBar: false,
    disabled: missing,
  };
  return (
    <React.Fragment>
      <DateInput
        value={start ? moment(start).toDate() : null}
        onChange={async (date) => {
          updateDate(startInput, date, setStart);
          setTriggerSave(true);
        }}
        inputProps={{ inputRef: startInput }}
        {...inputProps}
      />
      <span>{t('to')}</span>
      <DateInput
        value={end ? moment(end).toDate() : null}
        onChange={async (date) => {
          updateDate(endInput, date, setEnd);
          setTriggerSave(true);
        }}
        inputProps={{ inputRef: endInput }}
        {...inputProps}
      />
    </React.Fragment>
  );
};

export default withTranslation('column_filter')(DateFilter);
