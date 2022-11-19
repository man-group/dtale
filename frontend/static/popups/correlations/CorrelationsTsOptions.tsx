import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { CorrelationDateOption } from '../../repository/CorrelationsRepository';
import { renderCodePopupAnchor } from '../CodePopup';

import { CorrelationTimeseriesParameters } from './Correlations';

/** Component properties for CorrelationsTsOptions */
export interface CorrelationsTsOptionsProps {
  hasDate: boolean;
  rolling: boolean;
  useRolling: boolean;
  dates: CorrelationDateOption[];
  selectedCols: string[];
  selectedDate?: string;
  window: number;
  minPeriods: number;
  buildTs: (overrides?: Partial<CorrelationTimeseriesParameters>) => void;
  tsCode?: string;
}

const CorrelationsTsOptions: React.FC<CorrelationsTsOptionsProps & WithTranslation> = ({
  selectedCols,
  hasDate,
  dates,
  buildTs,
  tsCode,
  t,
  ...props
}) => {
  const [window, setWindow] = React.useState<string>(`${props.window}`);
  const [minPeriods, setMinPeriods] = React.useState<string>(`${props.minPeriods}`);
  const [useRolling, setUseRolling] = React.useState<boolean>(props.useRolling);

  const changeDate = (evt: React.ChangeEvent<HTMLSelectElement>): void => {
    const rolling = dates.find((date) => date.name === evt.target.value)?.rolling ?? false;
    buildTs({ selectedDate: evt.target.value, rolling, useRolling });
  };

  const renderDescription = (): JSX.Element => {
    let description = `${t('Timeseries of Pearson Correlation for')} ${selectedCols[0]} ${t('vs.')} ${selectedCols[1]}`;
    if (props.rolling) {
      description = `${t('Rolling Pearson Correlation (window')}: ${props.window})${t(' for ')}${selectedCols[0]} ${t(
        'vs.',
      )} ${selectedCols[1]}`;
    }
    let clicker = t('Click on any point in the chart to view a scatter plot of the data in that correlation');
    if (props.rolling) {
      clicker = t('Click on any point in the chart to view a scatter plot of the data in that rolling correlation');
    }
    return (
      <div className="col pl-0 pr-0">
        <div>
          <b>{description}</b>
        </div>
        <div style={{ marginTop: '-.5em' }}>
          <small>{`(${clicker})`}</small>
        </div>
      </div>
    );
  };

  const updateUseRolling = (): void => {
    setUseRolling(!useRolling);
    buildTs({ useRolling: !useRolling });
  };

  const updateWindowAndMinPeriods = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      const updatedWindow = window && parseInt(window, 10) ? parseInt(window, 10) : undefined;
      const updatedMinPeriods = minPeriods && parseInt(minPeriods, 10) ? parseInt(minPeriods, 10) : undefined;
      if (updatedWindow !== undefined || updatedMinPeriods !== undefined) {
        buildTs({ useRolling, window: updatedWindow, minPeriods: updatedMinPeriods });
      }
    }
  };

  const renderRollingWindow = (): JSX.Element => (
    <React.Fragment>
      {!props.rolling && (
        <React.Fragment>
          <div className="col text-center pr-0">
            <div>
              <b>{t('Use Rolling?')}</b>
            </div>
            <div style={{ marginTop: '-.5em' }}>
              <small>{t('(Rolling Mean)')}</small>
            </div>
          </div>
          <div style={{ marginTop: '.3em' }}>
            <i className={`ico-check-box${useRolling ? '' : '-outline-blank'} pointer`} onClick={updateUseRolling} />
          </div>
        </React.Fragment>
      )}
      <div className="col text-center">
        <div>
          <b>
            {t('Rolling')}
            <br />
            {t('Window')}
          </b>
        </div>
        <div style={{ marginTop: '-.5em' }}>
          <small>{t('(Please edit)')}</small>
        </div>
      </div>
      <div style={{ width: '3em' }} data-tip={t('Press ENTER to submit')}>
        <input
          type="text"
          className="form-control text-center"
          value={window}
          onChange={(e) => setWindow(e.target.value)}
          onKeyDown={updateWindowAndMinPeriods}
          disabled={!props.rolling && !useRolling}
          data-testid="window"
        />
      </div>
      <div className="col text-center">
        <div>
          <b>{t('Min Periods')}</b>
        </div>
        <div style={{ marginTop: '-.5em' }}>
          <small>{t('(Please edit)')}</small>
        </div>
      </div>
      <div style={{ width: '3em' }} data-tip={t('Press ENTER to submit')}>
        <input
          type="text"
          className="form-control text-center"
          value={minPeriods}
          onChange={(e) => setMinPeriods(e.target.value)}
          onKeyDown={updateWindowAndMinPeriods}
          disabled={!props.rolling && !useRolling}
          data-testid="min-periods"
        />
      </div>
    </React.Fragment>
  );

  return (
    <React.Fragment>
      {hasDate && !!selectedCols.length && (
        <div className="row pt-5">
          {renderDescription()}
          <div className="col-auto">
            <div className="form-group row small-gutters float-right pr-3" data-testid="corr-ts-inputs">
              {dates && dates.length > 1 && (
                <React.Fragment>
                  <label className="col-form-label text-right">{t('Date Column')}</label>
                  <div>
                    <select
                      className="form-control custom-select"
                      defaultValue={props.selectedDate}
                      onChange={changeDate}
                      data-testid="corr-selected-date"
                    >
                      {dates.map((d) => (
                        <option key={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </React.Fragment>
              )}
              {renderRollingWindow()}
            </div>
          </div>
          <div className="col-auto pl-0 pr-0 text-right" style={{ marginTop: '.3em' }}>
            {tsCode && renderCodePopupAnchor(tsCode, t('Correlations Timeseries'))}
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default withTranslation('correlations')(CorrelationsTsOptions);
