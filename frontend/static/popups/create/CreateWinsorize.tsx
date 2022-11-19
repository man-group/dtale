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
  WinsorizeConfig,
} from './CreateColumnState';
import { Checkbox } from './LabeledCheckbox';

require('./CreateWinsorize.css');

export const validateWinsorizeCfg = (t: TFunction, cfg: WinsorizeConfig): string | undefined => {
  if (!cfg.col) {
    return t('Please select a column to winsorize!') ?? undefined;
  }
  return undefined;
};

export const buildCode = (cfg: WinsorizeConfig): CreateColumnCodeSnippet => {
  if (!cfg.col) {
    return undefined;
  }
  const winsorizeParams = [`limits=[${cfg.limits.join(', ')}]`];
  if (cfg.inclusive.length) {
    winsorizeParams.push(`inclusive=[${cfg.inclusive.map((flag) => (flag ? 'True' : 'False')).join(', ')}]`);
  }
  const winsorizeParamsStr = `, ${winsorizeParams.join(', ')}`;
  const code = ['from scipy.stats import mstats\n'];
  if (!!cfg.group?.length) {
    code.push('def winsorize_series(group):');
    code.push(`\treturn mstats.winsorize(group${winsorizeParamsStr})\n`);
    code.push(`df.groupby(['${cfg.group?.join("', '")}'])['${cfg.col}'].transform(winsorize_series)\n`);
  } else {
    code.push(`mstats.winsorize(df['${cfg.col}']${winsorizeParamsStr})`);
  }
  return code;
};

const CreateWinsorize: React.FC<BaseCreateComponentProps & WithTranslation> = ({
  namePopulated,
  columns,
  updateState,
  t,
}) => {
  const [group, setGroup] = React.useState<Array<BaseOption<string>>>();
  const [col, setCol] = React.useState<BaseOption<string>>();
  const [limits, setLimits] = React.useState([10, 90]);
  const [includeLower, setIncludeLower] = React.useState(true);
  const [includeUpper, setIncludeUpper] = React.useState(true);

  React.useEffect(() => {
    const cfg: WinsorizeConfig = {
      group: group?.map(({ value }) => value),
      col: col?.value,
      limits: [Number((limits[0] / 100.0).toFixed(2)), Number((1.0 - limits[1] / 100.0).toFixed(2))],
      inclusive: [includeLower, includeUpper],
    };
    const updatedState: CreateColumnUpdateState = {
      cfg: { type: CreateColumnType.WINSORIZE, cfg },
      code: buildCode(cfg),
    };
    if (cfg.col && !namePopulated) {
      updatedState.name = `${cfg.col}_winsorize`;
    }
    updateState(updatedState);
  }, [group, col, limits, includeLower, includeUpper]);

  return (
    <React.Fragment>
      <ColumnSelect
        label={t('Col')}
        prop="col"
        otherProps={['group']}
        parent={{ col, group }}
        updateState={(updates: { col?: BaseOption<string> }) => setCol(updates.col)}
        columns={columns}
        dtypes={['int', 'float']}
      />
      <ColumnSelect
        label={t('Group By')}
        prop="group"
        otherProps={['col']}
        parent={{ col, group }}
        updateState={(updates: { group?: Array<BaseOption<string>> }) => setGroup(updates.group)}
        columns={columns}
        isMulti={true}
      />
      <div className="form-group row">
        <label className="col-md-3 col-form-label text-right">{t('Limits')}</label>
        <div className="col-md-8">
          <div className="input-group">
            <input
              type="text"
              className="form-control mr-3 slider-input"
              value={limits[0]}
              onChange={(e) => setLimits([parseInt(e.target.value, 10), limits[1]])}
              data-testid="winsorize-raw-min"
            />
            <StyledSlider
              defaultValue={limits}
              renderTrack={Track as any}
              renderThumb={Thumb}
              value={limits}
              onAfterChange={(value) => setLimits(value as number[])}
            />
            <input
              type="text"
              className="form-control ml-3 slider-input"
              value={limits[1]}
              onChange={(e) => setLimits([limits[0], parseInt(e.target.value, 10)])}
              data-testid="winsorize-raw-max"
            />
          </div>
        </div>
      </div>
      <div className="form-group row">
        <label className="col-md-3 col-form-label text-right">Include Limits</label>
        <div className="col-md-8 mt-auto mb-auto">
          <span>{t('Lower')}:</span>
          <Checkbox value={includeLower} setter={setIncludeLower} />
          <span>{t('Upper')}:</span>
          <Checkbox value={includeUpper} setter={setIncludeUpper} />
        </div>
      </div>
    </React.Fragment>
  );
};

export default withTranslation('builders')(CreateWinsorize);
