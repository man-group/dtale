import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import Collapsible from '../../Collapsible';
import { PPSInfo } from '../../repository/CorrelationsRepository';
import { displayScore, default as PPSDetails } from '../pps/PPSDetails';

/** Component properties for PPSCollapsibleProps */
interface PPSCollapsibleProps {
  ppsInfo?: PPSInfo;
}

const PPSCollapsible: React.FC<PPSCollapsibleProps & WithTranslation> = ({ ppsInfo, t }) => (
  <React.Fragment>
    {ppsInfo !== undefined && (
      <div className="row">
        <div className="col-md-12 pr-0 pl-0">
          <Collapsible
            title={`${t('Predictive Power Score for ')}${ppsInfo.x} ${t('vs.')} ${ppsInfo.y}: ${displayScore(ppsInfo)}`}
            content={<PPSDetails ppsInfo={ppsInfo} />}
          />
        </div>
      </div>
    )}
  </React.Fragment>
);

export default withTranslation('correlations')(PPSCollapsible);
