import { DateInput2 } from '@blueprintjs/datetime2';
import moment from 'moment';
import React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { BaseColumnFilterProps } from './ColumnFilterState';

import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/datetime/lib/css/blueprint-datetime.css';
import '@blueprintjs/datetime2/lib/css/blueprint-datetime2.css';

/** Component properties for DateFilter */
interface DateFilterProps extends BaseColumnFilterProps {
  min: string;
  max: string;
}

export const DateFilter: React.FC<DateFilterProps & WithTranslation> = ({
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

  const updateDate = (
    inputRef: React.RefObject<HTMLInputElement>,
    value: Date | undefined,
    setter: (v: Date | undefined) => void,
  ): void => {
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

  const createDateInput = (
    value: string | null,
    onChange: (newDate: string | null, isUserChange: boolean) => void,
    inputRef: React.Ref<HTMLInputElement>,
  ): React.ReactNode => (
    <DateInput2
      value={value ? moment(value, 'YYYYMMDD').toISOString() : null}
      onChange={onChange}
      inputProps={{ inputRef }}
      formatDate={(date: Date | null): string => moment(date).format('YYYYMMDD')}
      parseDate={(str: string) => moment(str).toDate()}
      placeholder="YYYYMMDD"
      popoverProps={{ usePortal: false }}
      minDate={minimum}
      maxDate={maximum}
      showActionsBar={false}
      disabled={missing}
    />
  );

  return (
    <React.Fragment>
      {createDateInput(
        start ? moment(start).format('YYYYMMDD') : null,
        async (date) => {
          updateDate(startInput, date ? moment(date).toDate() : undefined, setStart);
          setTriggerSave(true);
        },
        startInput,
      )}
      <span>{t('to')}</span>
      {createDateInput(
        end ? moment(end).format('YYYYMMDD') : null,
        async (date) => {
          updateDate(endInput, date ? moment(date).toDate() : undefined, setEnd);
          setTriggerSave(true);
        },
        endInput,
      )}
    </React.Fragment>
  );
};

export default withTranslation('column_filter')(DateFilter);
