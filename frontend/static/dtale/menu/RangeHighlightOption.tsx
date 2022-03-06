import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { Bouncer } from '../../Bouncer';
import { AppActions } from '../../redux/actions/AppActions';
import * as chartActions from '../../redux/actions/charts';
import * as settingsActions from '../../redux/actions/settings';
import { AppState, InstanceSettings, Popups, PopupType } from '../../redux/state/AppState';
import { ColumnDef } from '../DataViewerState';

import { MenuItem } from './MenuItem';
import { RibbonOptionProps } from './MenuState';

/** Component properties for RangeHighlightOption */
interface RangeHighlightOptionProps extends RibbonOptionProps {
  columns: ColumnDef[];
}
const RangeHighlightOption: React.FC<RangeHighlightOptionProps & WithTranslation> = ({
  columns,
  ribbonWrapper = (func) => func,
  t,
}) => {
  const { backgroundMode, rangeHighlight } = useSelector((state: AppState) => state.settings);
  const dispatch = useDispatch();
  const openChart = (chartData: Popups): AppActions<void> => dispatch(chartActions.openChart(chartData));
  const updateSettings = (updatedSettings: Partial<InstanceSettings>): AppActions<void> =>
    dispatch(settingsActions.updateSettings(updatedSettings));

  const openRangeHightlight = ribbonWrapper(() =>
    openChart({ type: PopupType.RANGE, size: 'sm', visible: true, backgroundMode, rangeHighlight, columns }),
  );
  const turnOffRangeHighlight = ribbonWrapper(() => {
    const updatedRangeHighlight = Object.entries(rangeHighlight ?? {}).reduce(
      (res, [key, value]) => ({ ...res, [key]: { ...value, active: false } }),
      {},
    );
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
