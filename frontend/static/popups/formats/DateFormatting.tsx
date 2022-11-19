import moment from 'moment';
import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { ColumnFormat } from '../../dtale/DataViewerState';

/** Base properties for Formatting components */
export interface BaseFormattingComponentProps {
  columnFormats: Record<string, ColumnFormat>;
  selectedCol: string;
  updateState: (state: ColumnFormat) => void;
}

const DateFormatting: React.FC<BaseFormattingComponentProps & WithTranslation> = ({
  columnFormats,
  selectedCol,
  updateState,
  t,
}) => {
  const [fmt, setFmt] = React.useState<string>();

  const m = moment(new Date('2000-01-01'));
  const exampleStr = m.format('MMMM Do YYYY, h:mm:ss a');
  const exampleOutput = fmt ? m.format(fmt) : exampleStr;
  return (
    <React.Fragment>
      <div className="form-group row">
        <label className="col-md-4 col-form-label text-right">
          <span>{t('moment.js Format')}</span>
          <i
            style={{ cursor: 'help' }}
            className="ico-info-outline pl-5"
            onClick={(e) => {
              e.preventDefault();
              window.open(
                'https://momentjs.com/docs/#/displaying/format/',
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
            value={fmt || ''}
            onChange={(event) => {
              setFmt(event.target.value);
              updateState({ fmt: event.target.value });
            }}
          />
        </div>
      </div>
      <div className="row text-left" style={{ fontSize: '80%' }} data-testid="date-format-examples">
        <div className="col-md-12">
          <span className="font-weight-bold pr-3">{t('Raw')}:</span>
          <span>{exampleStr}</span>
        </div>
        <div className="col-md-12">
          <span className="font-weight-bold pr-3">{t('Formatted')}:</span>
          <span>{exampleOutput}</span>
        </div>
      </div>
    </React.Fragment>
  );
};

export default withTranslation('formatting')(DateFormatting);
