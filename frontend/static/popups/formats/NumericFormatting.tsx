import getSymbolFromCurrency from 'currency-symbol-map';
import currencyToSymbolMap from 'currency-symbol-map/map';
import numeral from 'numeral';
import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import ButtonToggle from '../../ButtonToggle';
import { ColumnFormat } from '../../dtale/DataViewerState';
import { ColumnType } from '../../dtale/gridUtils';
import * as menuFuncs from '../../dtale/menu/dataViewerMenuUtils';
import { BaseOption } from '../../redux/state/AppState';
import { LabeledSelect } from '../create/LabeledSelect';

import { BaseFormattingComponentProps } from './DateFormatting';

/** Numeric formatting state properties */
interface NumericFormatState {
  precision?: number;
  thousands: boolean;
  abbreviate: boolean;
  exponent: boolean;
  bps: boolean;
  redNegs: boolean;
  currency?: BaseOption<string>;
}

const buildFormatter = (state: NumericFormatState): ColumnFormat => {
  const { precision, thousands, abbreviate, exponent, bps, currency } = state;
  let fmtStr = '0';
  if (thousands) {
    fmtStr = '0,000';
  }
  if (currency) {
    fmtStr = `${getSymbolFromCurrency(currency.value)}${fmtStr}`;
  }
  if (precision) {
    fmtStr += `.${Array(precision + 1).join('0')}`;
  }
  if (abbreviate) {
    fmtStr += 'a';
  }
  if (exponent) {
    fmtStr += 'e+0';
  }
  if (bps) {
    fmtStr += 'BPS';
  }

  return { fmt: fmtStr, style: { redNegs: state.redNegs, currency: state.currency?.value } };
};

const buildCurrencyOpt = (currency: string): BaseOption<string> => ({
  value: currency,
  label: `${currency} (${currencyToSymbolMap[currency]})`,
});

const parseState = (fmt: ColumnFormat): NumericFormatState => {
  const fmtStr = fmt.fmt as string;
  const parsedState: NumericFormatState = {
    thousands: fmtStr?.startsWith('0,000') ?? false,
    abbreviate: fmtStr?.includes('a') ?? false,
    exponent: fmtStr?.includes('e+0') ?? false,
    bps: fmtStr?.includes('BPS') ?? false,
    redNegs: fmt.style?.redNegs ?? false,
    currency: fmt.style?.currency ? buildCurrencyOpt(fmt.style.currency) : undefined,
  };
  if (fmtStr?.includes('.')) {
    let precision = 0;
    const precisionStr = fmtStr.split('.').pop();
    const precisionChars = Array.from(precisionStr ?? '');
    while (precisionChars.pop() === '0') {
      precision++;
    }
    parsedState.precision = precision;
  }
  return parsedState;
};

const EXAMPLE_NUM = -123456.789;

const NumericFormatting: React.FC<BaseFormattingComponentProps & WithTranslation> = ({
  columnFormats,
  selectedCol,
  updateState,
  t,
}) => {
  const currencyOptions = React.useMemo(
    () =>
      Object.keys(currencyToSymbolMap)
        .sort((a, b) => a.localeCompare(b))
        .map(buildCurrencyOpt),
    [],
  );
  const [fmt, setFmt] = React.useState(columnFormats[selectedCol] ?? { fmt: '' });
  const [state, setState] = React.useState<NumericFormatState>(
    columnFormats[selectedCol]
      ? parseState(columnFormats[selectedCol])
      : {
          thousands: false,
          abbreviate: false,
          exponent: false,
          bps: false,
          redNegs: false,
        },
  );

  React.useEffect(() => {
    const updatedFmt = buildFormatter(state);
    setFmt(updatedFmt);
    updateState(updatedFmt);
  }, [state]);

  const buildSimpleToggle = (prop: string, label: string, defaultValue: boolean): JSX.Element => {
    return (
      <div className="form-group row">
        <label className="col-md-4 col-form-label text-right">{t(label)}</label>
        <div className="col-md-6">
          <ButtonToggle
            options={[
              { value: true, label: 'On' },
              { value: false, label: 'Off' },
            ]}
            update={(value: boolean) => setState({ ...state, [prop]: value })}
            defaultValue={defaultValue}
            compact={false}
            className="col-auto pl-0"
          />
        </div>
      </div>
    );
  };

  return (
    <React.Fragment>
      <div className="form-group row">
        <label className="col-md-4 col-form-label text-right">{t('Precision')}</label>
        <div className="col-md-6">
          <ButtonToggle
            options={Array.from({ length: 7 }, (value: number, idx: number) => ({ value: idx }))}
            update={(value: number) => setState({ ...state, precision: value })}
            defaultValue={state.precision}
            compact={false}
            className="col-auto pl-0"
          />
        </div>
      </div>
      {buildSimpleToggle('thousands', 'Thousands Separator', state.thousands)}
      {buildSimpleToggle('abbreviate', 'Abbreviate', state.abbreviate)}
      {buildSimpleToggle('exponent', 'Exponent', state.exponent)}
      {buildSimpleToggle('bps', 'BPS', state.bps)}
      {buildSimpleToggle('redNegs', 'Red Negatives', state.redNegs)}
      <LabeledSelect
        label={t('Currency')}
        options={currencyOptions}
        value={state.currency}
        onChange={(selected) => setState({ ...state, currency: selected as BaseOption<string> })}
        labelWidth={4}
        inputWidth={6}
      />
      <div className="form-group row">
        <label className="col-md-4 col-form-label text-right">
          <span>{t('Numeral.js Format')}</span>
          <i
            style={{ cursor: 'help' }}
            className="ico-info-outline pl-5"
            onClick={(e) => {
              e.preventDefault();
              window.open(
                'http://numeraljs.com/#format',
                undefined,
                'titlebar=1,location=1,status=1,width=990,height=450',
              );
            }}
          />
        </label>
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            value={(fmt.fmt as string) ?? ''}
            onChange={(event) => setFmt({ ...Object, fmt: event.target.value })}
          />
        </div>
      </div>
      <div className="row text-center">
        <small className="col-md-10">
          {`${t('EX')}: ${EXAMPLE_NUM} => `}
          <span
            style={menuFuncs.buildStyling(EXAMPLE_NUM, ColumnType.FLOAT, {
              redNegs: state.redNegs,
              currency: state.currency?.value,
            })}
          >
            {fmt ? numeral(EXAMPLE_NUM).format(fmt.fmt as string) : EXAMPLE_NUM}
          </span>
        </small>
      </div>
    </React.Fragment>
  );
};

export default withTranslation('formatting')(NumericFormatting);
