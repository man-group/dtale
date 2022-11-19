import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { StringColumnFormat } from '../../dtale/DataViewerState';
import { truncate } from '../../stringUtils';
import { LabeledCheckbox } from '../create/LabeledCheckbox';
import { LabeledInput } from '../create/LabeledInput';

import { BaseFormattingComponentProps } from './DateFormatting';

const BASE_FMT = { html: false, link: false };

const StringFormatting: React.FC<BaseFormattingComponentProps & WithTranslation> = ({
  columnFormats,
  selectedCol,
  updateState,
  t,
}) => {
  const [fmt, setFmt] = React.useState<StringColumnFormat>({
    ...BASE_FMT,
    ...(columnFormats[selectedCol]?.fmt as StringColumnFormat),
  });

  React.useEffect(() => {
    updateState({ fmt });
  }, [fmt]);

  const exampleStr = t('I am a long piece of text, please truncate me.');
  const exampleOutput = fmt.truncate ? truncate(exampleStr, fmt.truncate) : exampleStr;
  return (
    <React.Fragment>
      <LabeledCheckbox
        rowClass="mb-2"
        labelWidth={4}
        label={`${t('Render as Hyperlink')}?`}
        value={fmt.link}
        setter={(value) => setFmt({ ...fmt, link: value, html: value ? false : fmt.html })}
      />
      <LabeledCheckbox
        rowClass="mb-2"
        labelWidth={4}
        label={`${t('Render as HTML')}?`}
        value={fmt.html}
        setter={(value) => setFmt({ ...fmt, html: value, link: value ? false : fmt.link })}
      />
      <LabeledInput
        type="number"
        label={t('Truncation')}
        value={fmt.truncate ?? ''}
        setter={(value) => {
          if (value && parseInt(value, 10)) {
            setFmt({ ...fmt, truncate: parseInt(value, 10) });
          }
        }}
        labelWidth={4}
        inputWidth={6}
      />
      <div className="row text-left" style={{ fontSize: '80%' }}>
        <div className="col-md-12 text-center">
          <span className="font-weight-bold pr-3">{t('Raw')}:</span>
          <span>{exampleStr}</span>
        </div>
        <div className="col-md-12 text-center">
          <span className="font-weight-bold pr-3">{t('Truncated')}:</span>
          <span>{exampleOutput}</span>
        </div>
      </div>
    </React.Fragment>
  );
};

export default withTranslation('formatting')(StringFormatting);
