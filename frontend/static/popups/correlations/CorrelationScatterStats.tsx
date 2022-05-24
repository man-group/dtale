import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { CorrelationStats } from '../../repository/CorrelationsRepository';
import { renderCodePopupAnchor } from '../CodePopup';
import { displayScore, default as PPSDetails } from '../pps/PPSDetails';

import * as corrUtils from './correlationsUtils';

/** Component properties for CorrelationScatterStats */
interface CorrelationScatterStatsProps {
  selectedCols: string[];
  date?: string;
  stats: CorrelationStats;
  code: string;
}

const CorrelationScatterStats: React.FC<CorrelationScatterStatsProps & WithTranslation> = ({
  selectedCols,
  date,
  stats,
  code,
  t,
}) => {
  if (!Object.keys(stats ?? {}).length) {
    return null;
  }
  const { pearson, spearman, pps, correlated } = stats;
  const [col0, col1] = selectedCols;
  return (
    <React.Fragment>
      <div className="pt-5">
        <dl className="property-pair inline">
          <dt>
            <b>{`${col0} ${t('vs.', { ns: 'correlations' })} ${col1}${date ?? ''}`}</b>
          </dt>
        </dl>
        <dl className="property-pair inline">
          <dt>{t('correlations:Pearson')}</dt>
          <dd>{corrUtils.percent(pearson)}</dd>
        </dl>
        <dl className="property-pair inline">
          <dt>{t('correlations:Spearman')}</dt>
          <dd>{corrUtils.percent(spearman)}</dd>
        </dl>
        {pps && (
          <dl className="property-pair inline">
            <dt>{t('correlations:PPS')}</dt>
            <dd className="hoverable">
              {displayScore(pps)}
              <div className="hoverable__content">
                <h4>{t('Predictive Power Score', { ns: 'menu' })}</h4>
                <PPSDetails ppsInfo={pps} />
              </div>
            </dd>
          </dl>
        )}
        <dl className="property-pair inline">
          <dt>{t('correlations:Correlated')}</dt>
          <dd>{correlated}</dd>
        </dl>
        <dl className="property-pair inline">
          <dt>{`${t('Only in', { ns: 'correlations' })} ${col0}`}</dt>
          <dd>{stats.only_in_s0}</dd>
        </dl>
        <dl className="property-pair inline">
          <dt>{`${t('Only in', { ns: 'correlations' })} ${col1}`}</dt>
          <dd>{stats.only_in_s1}</dd>
        </dl>
        <dl className="property-pair inline float-right">
          {renderCodePopupAnchor(code, t('Correlations Scatter', { ns: 'correlations' }))}
        </dl>
      </div>
      <div style={{ marginTop: '-.5em' }}>
        <small>
          {t('(Click on any point in the scatter to filter the grid down to that record)', { ns: 'correlations' })}
        </small>
      </div>
    </React.Fragment>
  );
};

export default withTranslation(['menu', 'correlations'])(CorrelationScatterStats);
