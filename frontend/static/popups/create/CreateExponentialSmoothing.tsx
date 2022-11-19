import { TFunction } from 'i18next';
import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { BaseOption } from '../../redux/state/AppState';
import { StyledSlider, Thumb, Track } from '../../sliderUtils';

import { CreateColumnCodeSnippet } from './CodeSnippet';
import ColumnSelect from './ColumnSelect';
import {
  BaseCreateComponentProps,
  CreateColumnType,
  CreateColumnUpdateState,
  ExponentialSmoothingConfig,
} from './CreateColumnState';

export const validateExponentialSmoothingCfg = (t: TFunction, cfg: ExponentialSmoothingConfig): string | undefined => {
  if (!cfg.col) {
    return t('Please select a column to smooth!') ?? undefined;
  }
  if (!cfg.alpha) {
    return t('Please enter a valid float for alpha!') ?? undefined;
  }
  return undefined;
};

export const buildCode = (cfg: ExponentialSmoothingConfig): CreateColumnCodeSnippet => {
  if (!cfg.col) {
    return undefined;
  }
  if (!cfg.alpha) {
    return undefined;
  }
  return [
    `s = df['${cfg.col}'].values`,
    'result = [s[0]]',
    'for n in range(1, len(s)):',
    `\tresult.append(${cfg.alpha} * s[n] + (1 - ${cfg.alpha}) * result[n - 1])`,
    'pd.Series(result, index=df.index)',
  ];
};

const CreateExponentialSmoothing: React.FC<BaseCreateComponentProps & WithTranslation> = ({
  namePopulated,
  columns,
  updateState,
  t,
}) => {
  const [col, setCol] = React.useState<BaseOption<string>>();
  const [alpha, setAlpha] = React.useState(0.0);

  React.useEffect(() => {
    const cfg: ExponentialSmoothingConfig = { col: col?.value, alpha };
    const updatedState: CreateColumnUpdateState = {
      cfg: { type: CreateColumnType.EXPONENTIAL_SMOOTHING, cfg },
      code: buildCode(cfg),
    };
    if (cfg.col && !namePopulated) {
      updatedState.name = `${cfg.col}_exp_smooth`;
    }
    updateState(updatedState);
  }, [col, alpha]);

  return (
    <React.Fragment>
      <ColumnSelect
        label={t('Col')}
        prop="col"
        parent={{ col }}
        updateState={(updates: { col?: BaseOption<string> }) => setCol(updates.col)}
        columns={columns}
        dtypes={['int', 'float']}
      />
      <div className="form-group row">
        <label className="col-md-3 col-form-label text-right">{t('Alpha')}</label>
        <div className="col-md-8">
          <div className="input-group">
            <input
              type="number"
              className="form-control mr-3 alpha-slider-input"
              value={alpha}
              onChange={(e) => setAlpha(Number(e.target.value))}
              data-testid="alpha-raw-input"
            />
            <StyledSlider
              defaultValue={isNaN(alpha) ? 0.0 : alpha}
              renderTrack={Track as any}
              renderThumb={Thumb}
              value={isNaN(alpha) ? 0.0 : alpha}
              min={0.0}
              max={1.0}
              step={0.01}
              onAfterChange={(update) => setAlpha(Number(update))}
            />
          </div>
          <small>{t('alpha_description')}</small>
        </div>
      </div>
    </React.Fragment>
  );
};

export default withTranslation('builders')(CreateExponentialSmoothing);
