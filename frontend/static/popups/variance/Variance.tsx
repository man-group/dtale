import { createSelector } from '@reduxjs/toolkit';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { BouncerWrapper } from '../../BouncerWrapper';
import * as gu from '../../dtale/gridUtils';
import { useAppSelector } from '../../redux/hooks';
import { selectChartData, selectDataId, selectSettings } from '../../redux/selectors';
import { VariancePopupData } from '../../redux/state/AppState';
import { RemovableError } from '../../RemovableError';
import * as VarianceRepository from '../../repository/VarianceRepository';
import { renderCodePopupAnchor } from '../CodePopup';
import FilterableToggle from '../FilterableToggle';

import VarianceChart from './VarianceChart';

const toPercent = (value: number): string => (100 * value).toFixed(2);

const selectResult = createSelector([selectDataId, selectChartData, selectSettings], (dataId, chartData, settings) => ({
  dataId,
  chartData: chartData as VariancePopupData,
  settings,
}));

const Variance: React.FC<WithTranslation> = ({ t }) => {
  const { dataId, chartData, settings } = useAppSelector(selectResult);
  const preExistingFilters = React.useMemo(() => {
    const { query, columnFilters, outlierFilters, predefinedFilters } = settings;
    return !gu.noFilters({ query, columnFilters, outlierFilters, predefinedFilters });
  }, [settings]);
  const [filtered, setFiltered] = React.useState(preExistingFilters);
  const [loadingVariance, setLoadingVariance] = React.useState(true);
  const [error, setError] = React.useState<JSX.Element>();
  const [varianceData, setVarianceData] = React.useState<VarianceRepository.VarianceResponse>();

  const loadVariance = (): void => {
    VarianceRepository.load(dataId, chartData.selectedCol, filtered).then((response) => {
      setLoadingVariance(false);
      if (response?.error) {
        setError(<RemovableError {...response} />);
        return;
      }
      setError(undefined);
      setVarianceData(response);
    });
  };

  React.useEffect(() => {
    loadVariance();
  }, []);

  React.useEffect(() => {
    loadVariance();
  }, [filtered]);

  const renderCheck2 = (): JSX.Element => {
    if (!varianceData?.check2) {
      return <li>{t('Check 2')}: N/A</li>;
    }
    const { check2 } = varianceData;
    const val1 = check2.val1.val;
    const val2 = check2.val2.val;
    const check2Msg = t(`Count of most common value / Count of second most common value > 20`);
    const check2Ratio = (check2.val1.ct / check2.val2.ct).toFixed(2);
    return (
      <React.Fragment>
        <li>
          <span className="mr-3">{`${t('Check 2')}: ${check2Msg} =>`}</span>
          <b>{check2.result + ''}</b>
        </li>
        <ul>
          <li>
            <span className="mr-3">{`${t('Count of most common')} "${val1}":`}</span>
            <b>{check2.val1.ct}</b>
          </li>
          <li>
            <span className="mr-3">{`${t('Count of second most common')} "${val2}":`}</span>
            <b>{check2.val2.ct}</b>
          </li>
          <li>
            <span className="mr-3">{t('Ratio')}:</span>
            <b>{check2Ratio}</b>
          </li>
        </ul>
      </React.Fragment>
    );
  };

  if (error) {
    return (
      <div key="body" className="modal-body">
        {error}
      </div>
    );
  }
  const column = chartData.selectedCol;
  if (!varianceData) {
    return null;
  }
  const { code, check1, check2, size, outlierCt, missingCt, jarqueBera, shapiroWilk } = varianceData;
  const check1Pct = toPercent(check1.unique / check1.size);
  const check1Msg = `${t('Check 1')}: ${t('Count of unique values in a feature / sample size < 10%')}`;
  const check2res = check2?.result ?? false;
  const lowVariance = check1.result && check2res;
  const header = [
    t('Based on checks 1 & 2'),
    `"${column}"`,
    lowVariance ? t('has') : t('does not have'),
    t('Low Variance'),
  ].join(' ');
  return (
    <div key="body" className="modal-body describe-body">
      <BouncerWrapper showBouncer={loadingVariance}>
        <div className="row">
          <div className="col">
            <h1>{header}</h1>
          </div>
          <FilterableToggle
            hasFilters={preExistingFilters}
            filtered={filtered}
            propagateState={(state) => setFiltered(state.filtered)}
          />
        </div>
        <ul>
          <li>
            <span className="mr-3">{`${check1Msg} =>`}</span>
            <b>{check1.result + ''}</b>
          </li>
          <ul>
            <li>
              <span className="mr-3">{t('Unique Values')}:</span>
              <b>{check1.unique}</b>
            </li>
            <li>
              <span className="mr-3">{t('Sample Size')}:</span>
              <b>{check1.size}</b>
            </li>
            <li>
              <span className="mr-3">{t('Percentage')}:</span>
              <b>{check1Pct}%</b>
            </li>
          </ul>
          {renderCheck2()}
          <li>
            <span className="mr-3">{t('Percentage Missing')}:</span>
            <b>{toPercent(missingCt / size)}%</b>
          </li>
          <li>
            <span className="mr-3">{t('Percentage Outliers')}:</span>
            <b>{toPercent(outlierCt / size)}%</b>
          </li>
          <li>{t('Jarque-Bera')}</li>
          <ul>
            <li>
              {t('Statistic')}: <b>{jarqueBera.statistic.toFixed(2)}</b>
            </li>
            <li>
              {t('P-value')}: <b>{jarqueBera.pvalue.toFixed(2)}</b>
            </li>
          </ul>
          <li>{t('Shapiro-Wilk')}</li>
          <ul>
            <li>
              {t('Statistic')}: <b>{shapiroWilk.statistic.toFixed(2)}</b>
            </li>
            <li>
              {t('P-value')}: <b>{shapiroWilk.pvalue.toFixed(2)}</b>
            </li>
          </ul>
        </ul>
        <div
          style={{
            position: 'absolute',
            right: 25,
            top: 60,
          }}
        >
          {renderCodePopupAnchor(code, t('Variance'))}
        </div>
        <div
          style={{
            position: 'absolute',
            width: '50%',
            height: 325,
            right: 25,
            bottom: 0,
          }}
        >
          <VarianceChart filtered={filtered} height={275} />
        </div>
      </BouncerWrapper>
    </div>
  );
};

export default withTranslation('variance')(Variance);
