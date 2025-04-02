import { createSelector } from '@reduxjs/toolkit';
import React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { BouncerWrapper } from '../../BouncerWrapper';
import { useAppSelector } from '../../redux/hooks';
import { selectChartData, selectDataId } from '../../redux/selectors';
import { PPSPopupData } from '../../redux/state/AppState';
import { RemovableError } from '../../RemovableError';
import * as CorrelationsRepository from '../../repository/CorrelationsRepository';
import { CorrelationsGridState } from '../correlations/Correlations';
import CorrelationsGrid from '../correlations/CorrelationsGrid';
import * as corrUtils from '../correlations/correlationsUtils';

import { displayScore, default as PPSDetails } from './PPSDetails';

/** Correlations grid state properties w/ PPS support */
type PPSGridState = CorrelationsGridState & { pps: CorrelationsRepository.PPSGridRow[] };

const selectResult = createSelector([selectDataId, selectChartData], (dataId, chartData) => ({
  dataId,
  chartData: chartData as PPSPopupData,
}));

const PredictivePowerScore: React.FC<WithTranslation> = ({ t }) => {
  const { dataId, chartData } = useAppSelector(selectResult);
  const [correlations, setCorrelations] = React.useState<PPSGridState>();
  const [error, setError] = React.useState<JSX.Element>();
  const [selectedCols, setSelectedCols] = React.useState<string[]>([]);
  const [loadingPps, setLoadingPps] = React.useState<boolean>(true);
  const [encodeStrings, setEncodeStrings] = React.useState<boolean>(false);

  const loadGrid = async (updatedEncodeStrings?: boolean): Promise<void> => {
    const response = await CorrelationsRepository.loadCorrelations(
      dataId,
      updatedEncodeStrings !== undefined ? updatedEncodeStrings : encodeStrings,
      true,
    );
    if (response?.error) {
      setError(<RemovableError {...response} />);
      setLoadingPps(false);
      return;
    }
    if (response) {
      const { data, strings, code, dummyColMappings } = response;
      const dates = response.dates ?? [];
      const columns = data.map((row) => row.column);
      const correlationsState = {
        correlations: data,
        pps: response.pps ?? [],
        columns,
        dates: response.dates ?? [],
        strings: strings ?? [],
        dummyColMappings: dummyColMappings ?? {},
        hasDate: dates.length > 0,
        code,
      };
      setLoadingPps(false);
      setCorrelations(correlationsState);
    }
  };

  React.useEffect(() => {
    (async () => loadGrid())();
  }, []);

  React.useEffect(() => {
    const { col1, col2 } = corrUtils.findCols(chartData, correlations?.columns ?? []);
    if (col1 && col2) {
      setSelectedCols([col1, col2]);
    }
  }, [correlations]);

  const ppsInfo = correlations?.pps.find(({ x, y }) => x === selectedCols[0] && y === selectedCols?.[1]);
  return (
    <div key="body" className="modal-body scatter-body">
      {error}
      {!error && (
        <BouncerWrapper showBouncer={loadingPps}>
          {correlations && (
            <React.Fragment>
              <CorrelationsGrid
                buildScatter={(updatedSelectedCols: string[]) => setSelectedCols(updatedSelectedCols)}
                colorScale={corrUtils.ppsScale}
                isPPS={true}
                {...{
                  ...chartData,
                  ...correlations,
                  selectedCols,
                  encodeStrings,
                }}
                toggleStrings={async () => {
                  setEncodeStrings(!encodeStrings);
                  await loadGrid(!encodeStrings);
                }}
              />
              {ppsInfo && (
                <React.Fragment>
                  <h2 className="pt-5">
                    {`${t('Prediction Power Score for', { ns: 'pps' })} ${ppsInfo.x} `}
                    {`${t('vs.', { ns: 'correlations' })} ${ppsInfo.y}: ${displayScore(ppsInfo)}`}
                  </h2>
                  <PPSDetails ppsInfo={ppsInfo} />
                </React.Fragment>
              )}
            </React.Fragment>
          )}
        </BouncerWrapper>
      )}
    </div>
  );
};

export default withTranslation(['pps', 'correlations'])(PredictivePowerScore);
