import { createSelector, PayloadAction } from '@reduxjs/toolkit';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { Bouncer } from '../../Bouncer';
import * as chartActions from '../../redux/actions/charts';
import * as settingsActions from '../../redux/actions/settings';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { selectBackgroundMode, selectRangeHighlight } from '../../redux/selectors';
import { InstanceSettings, Popups, PopupType, RangeHighlightConfig } from '../../redux/state/AppState';
import { ColumnDef } from '../DataViewerState';

import { MenuItem } from './MenuItem';
import { RibbonOptionProps } from './MenuState';

/** Component properties for RangeHighlightOption */
interface RangeHighlightOptionProps extends RibbonOptionProps {
  columns: ColumnDef[];
}

const selectResult = createSelector([selectBackgroundMode, selectRangeHighlight], (backgroundMode, rangeHighlight) => ({
  backgroundMode,
  rangeHighlight,
}));

const RangeHighlightOption: React.FC<RangeHighlightOptionProps & WithTranslation> = ({
  columns,
  ribbonWrapper = (func) => func,
  t,
}) => {
  const { backgroundMode, rangeHighlight } = useAppSelector(selectResult);
  const dispatch = useAppDispatch();
  const openChart = (chartData: Popups): PayloadAction<Popups> => dispatch(chartActions.openChart(chartData));
  const updateSettings = (updatedSettings: Partial<InstanceSettings>): void =>
    dispatch(settingsActions.updateSettings(updatedSettings));

  const openRangeHightlight = ribbonWrapper(() =>
    openChart({
      type: PopupType.RANGE,
      size: 'sm',
      visible: true,
      backgroundMode,
      rangeHighlight: { ...rangeHighlight },
      columns,
    }),
  );
  const turnOffRangeHighlight = ribbonWrapper(() => {
    const updatedRangeHighlight = JSON.parse(JSON.stringify(rangeHighlight ?? {})) as RangeHighlightConfig;
    Object.values(updatedRangeHighlight).forEach((value) => (value.active = false));
    updateSettings({ rangeHighlight: updatedRangeHighlight, backgroundMode: undefined });
  });

  return (
    <MenuItem description={t('menu_description:highlight_range')} onClick={openRangeHightlight}>
      <span className="toggler-action">
        <button className="btn btn-plain">
          <div style={{ display: 'inherit' }}>
            {backgroundMode === 'range' && (
              <div className="bg-range-bouncer">
                <Bouncer />
              </div>
            )}
            {backgroundMode !== 'range' && <div className="bg-range-icon" />}
            <span className="font-weight-bold pl-4">{t('Highlight Range', { ns: 'menu' })}</span>
          </div>
        </button>
      </span>
      {backgroundMode === 'range' && (
        <div className="ml-auto mt-auto mb-auto">
          <i
            className="ico-close-circle pointer mr-3 btn-plain"
            onClick={(e) => {
              turnOffRangeHighlight();
              e.stopPropagation();
            }}
          />
        </div>
      )}
    </MenuItem>
  );
};

export default withTranslation(['menu', 'menu_description'])(RangeHighlightOption);
