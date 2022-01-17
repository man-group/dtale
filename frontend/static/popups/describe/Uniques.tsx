import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { UniquesData } from './DescribeState';

/** Component properties for Uniques */
interface UniquesProps {
  uniques: UniquesData;
  dtype?: string;
  baseTitle?: string;
}

const Uniques: React.FC<UniquesProps & WithTranslation> = ({ uniques, dtype, baseTitle, t }) => (
  <React.Fragment>
    {!!uniques.data.length && (
      <div className="row">
        <div className="col-sm-12">
          <span className="font-weight-bold" style={{ fontSize: '120%' }}>
            {t(baseTitle ?? 'Unique Row')}
            {dtype && ` ${t('of type')} '${dtype}'`}
            {` ${t('Values')}`}
            {uniques.top !== undefined && ` (${t('top 100 most common')})`}
            {`:`}
          </span>
          <br />
          <span>{uniques.data.map((u) => `${u.value} (${u.count})`).join(', ')}</span>
        </div>
      </div>
    )}
  </React.Fragment>
);

export default withTranslation('describe')(Uniques);
