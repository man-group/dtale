import numeral from 'numeral';
import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { PPSInfo } from '../../repository/CorrelationsRepository';

export const displayScore = (pps: PPSInfo): string =>
  pps?.is_valid_score === true ? numeral(pps.ppscore).format('0.00') : 'N/A';

const buildSpan = (text: string): JSX.Element => <span className="font-weight-bold">{text}</span>;

/** Component properties for PPSDetails */
interface PPSDetailsProps {
  ppsInfo: PPSInfo;
}

const PPSDetails: React.FC<PPSDetailsProps & WithTranslation> = ({ ppsInfo, t }) => (
  <React.Fragment>
    {!!Object.keys(ppsInfo).length && (
      <ul className="ppscore-descriptors">
        <li>
          {`${t('Baseline Score')}: `}
          {buildSpan(numeral(ppsInfo.baseline_score).format('0,000.00'))}
        </li>
        <li>
          {`${t('Case')}: `}
          {buildSpan(ppsInfo.case)}
        </li>
        <li>
          {`${t('Is Valid Score')}: `}
          {buildSpan(ppsInfo?.is_valid_score === true ? 'Yes' : 'No')}
        </li>
        <li>
          {`${t('Score')}: `}
          {buildSpan(displayScore(ppsInfo))}
        </li>
        <li>
          {`${t('Metric')}: `}
          {buildSpan(ppsInfo?.metric ?? '')}
        </li>
        <li>
          {`${t('Model')}: `}
          {buildSpan(ppsInfo?.model ?? '')}
        </li>
        <li>
          {`${t('Model Score')}: `}
          {buildSpan(numeral(ppsInfo.model_score).format('0,000.00'))}
        </li>
      </ul>
    )}
  </React.Fragment>
);

export default withTranslation('pps')(PPSDetails);
