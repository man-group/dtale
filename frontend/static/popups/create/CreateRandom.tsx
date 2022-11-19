import { DateInput2 } from '@blueprintjs/datetime2';
import { TFunction } from 'i18next';
import moment from 'moment';
import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import ButtonToggle from '../../ButtonToggle';
import { capitalize } from '../../stringUtils';

import { buildRandomCode as buildCode } from './codeSnippets';
import {
  BaseCreateComponentProps,
  CreateColumnType,
  CreateColumnUpdateState,
  RandomConfigs,
  RandomType,
} from './CreateColumnState';
import { LabeledCheckbox } from './LabeledCheckbox';
import { LabeledInput } from './LabeledInput';

import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/datetime/lib/css/blueprint-datetime.css';
import '@blueprintjs/datetime2/lib/css/blueprint-datetime2.css';

const DATE_FMT = 'YYYYMMDD';
const MIN_DATE = '19000101';
const MAX_DATE = '21991231';

export const validateRandomCfg = (t: TFunction, cfg: RandomConfigs): string | undefined => {
  const { type } = cfg;
  if (RandomType.INT === type || RandomType.FLOAT === type) {
    const low = cfg.low ? parseInt(cfg.low, 10) : undefined;
    const high = cfg.high ? parseInt(cfg.high, 10) : undefined;
    if (low && !isNaN(low) && high && !isNaN(high) && low > high) {
      return t('Invalid range specification, low must be less than high!') ?? undefined;
    }
  } else if (type === RandomType.DATE) {
    const start = cfg.start ? moment(cfg.start) : undefined;
    const end = cfg.end ? moment(cfg.end) : undefined;
    if (start && end && start.isAfter(end)) {
      return t('Start must be before End!') ?? undefined;
    }
  }
  return undefined;
};

const dateFormatter = (date: Date | null): string => moment(date).format(DATE_FMT);

const CreateRandom: React.FC<BaseCreateComponentProps & WithTranslation> = ({
  namePopulated,
  columns,
  updateState,
  t,
}) => {
  const [type, setType] = React.useState(RandomType.FLOAT);
  const [low, setLow] = React.useState<string>();
  const [high, setHigh] = React.useState<string>();
  const [length, setLength] = React.useState<number>();
  const [chars, setChars] = React.useState<string>();
  const [choices, setChoices] = React.useState<string>();
  const [start, setStart] = React.useState<string>();
  const [end, setEnd] = React.useState<string>();
  const [businessDay, setBusinessDay] = React.useState(false);
  const [timestamps, setTimestamps] = React.useState(false);

  React.useEffect(() => {
    let cfg: RandomConfigs;
    switch (type) {
      case RandomType.STRING:
        cfg = { type, chars, length };
        break;
      case RandomType.DATE:
        cfg = {
          type,
          start,
          end,
          businessDay,
          timestamps,
        };
        break;
      case RandomType.CHOICE:
        cfg = { type, choices };
        break;
      case RandomType.INT:
      case RandomType.FLOAT:
      default:
        cfg = { type, low, high };
        break;
    }
    const updatedState: CreateColumnUpdateState = { cfg: { type: CreateColumnType.RANDOM, cfg }, code: buildCode(cfg) };
    if (!namePopulated) {
      let nameIdx = 1;
      let name = `random_col${nameIdx}`;
      while (columns.find((column) => column.name === name)) {
        nameIdx++;
        name = `random_col${nameIdx}`;
      }
      updatedState.name = name;
    }
    updateState(updatedState);
  }, [type, low, high, length, chars, choices, start, end, businessDay, timestamps]);

  const buildDateInput = (setter: (value?: string) => void, defaultValue: string, value?: string): JSX.Element => (
    <div className="col-md-3 text-left">
      <DateInput2
        formatDate={dateFormatter}
        parseDate={(str) => moment(str).toDate()}
        placeholder={DATE_FMT}
        popoverProps={{ usePortal: false }}
        minDate={moment(MIN_DATE).toDate()}
        maxDate={moment(MAX_DATE).toDate()}
        showActionsBar={false}
        value={value ? moment(value, DATE_FMT).toISOString() : null}
        onChange={(date) => setter(date ?? undefined)}
      />
      <small>{`(Default: ${defaultValue})`}</small>
    </div>
  );

  const renderDateInputs = (): JSX.Element => (
    <React.Fragment>
      <div className="form-group row mb-0" data-testid="date-inputs">
        <label className="col-md-3 col-form-label text-right">{t('Range')}</label>
        {buildDateInput(setStart, MIN_DATE, start)}
        <div className="col-auto p-0">
          <span>{t('to')}</span>
        </div>
        {buildDateInput(setEnd, MAX_DATE, end)}
      </div>
      <LabeledCheckbox label={t('Business Dates')} value={businessDay} setter={setBusinessDay} rowClass="mb-0" />
      <LabeledCheckbox label={t('Include Timestamps')} value={timestamps} setter={setTimestamps} />
    </React.Fragment>
  );

  return (
    <React.Fragment>
      <div className="form-group row">
        <label className="col-md-3 col-form-label text-right">{t('Data Type')}</label>
        <div className="col-md-8">
          <ButtonToggle
            options={Object.values(RandomType).map((value) => ({ value, label: capitalize(value) }))}
            update={setType}
            defaultValue={type}
            compact={false}
          />
        </div>
      </div>
      {RandomType.STRING === type && (
        <React.Fragment>
          <LabeledInput
            type="number"
            label={t('Length') ?? ''}
            value={length}
            setter={(value) => setLength(Number(value))}
            subLabel={`${t('Default')}: 10`}
          />
          <LabeledInput
            label={t('Chars') ?? ''}
            value={chars}
            setter={setChars}
            subLabel={`${t('Default')}: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'`}
          />
        </React.Fragment>
      )}
      {[RandomType.INT, RandomType.FLOAT].includes(type) && (
        <React.Fragment>
          <LabeledInput
            type="number"
            label={t('Low') ?? ''}
            value={low}
            setter={setLow}
            subLabel={`${t('Default')}: 0`}
          />
          <LabeledInput
            type="number"
            label={t('Low') ?? ''}
            value={high}
            setter={setHigh}
            subLabel={`${t('Default')}: ${type === RandomType.FLOAT ? '1' : '100'}`}
          />
        </React.Fragment>
      )}
      {RandomType.CHOICE === type && (
        <LabeledInput
          label={t('Choices') ?? ''}
          value={choices}
          setter={setChoices}
          subLabel={`${t('Default')}: 'a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z'`}
        />
      )}
      {RandomType.DATE === type && renderDateInputs()}
    </React.Fragment>
  );
};

export default withTranslation('builders')(CreateRandom);
