import { createSelector, PayloadAction } from '@reduxjs/toolkit';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { AppActions } from '../../redux/actions/AppActions';
import * as actions from '../../redux/actions/dtale';
import * as settingsActions from '../../redux/actions/settings';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { selectSettings, selectShowAllHeatmapColumns } from '../../redux/selectors';

import { MenuItem } from './MenuItem';

const selectResult = createSelector(
  [selectSettings, selectShowAllHeatmapColumns],
  (settings, showAllHeatmapColumns) => ({ showAllHeatmapColumns, settings }),
);

const ShowNonNumericHeatmapColumns: React.FC<WithTranslation> = ({ t }) => {
  const { showAllHeatmapColumns, settings } = useAppSelector(selectResult);
  const dispatch = useAppDispatch();
  const hideRibbonMenu = (): PayloadAction<void> => dispatch(AppActions.HideRibbonMenuAction());
  const toggleBackground = (backgroundMode: string): void =>
    dispatch(settingsActions.updateSettings({ backgroundMode }));

  const updateShowAllHeatmapColumns = (): void => {
    const updatedShowAllHeatmapColumns = !showAllHeatmapColumns;
    dispatch(actions.updateShowAllHeatmapColumns(updatedShowAllHeatmapColumns));
    if (settings.backgroundMode) {
      if (['heatmap-col', 'heatmap-all'].includes(settings.backgroundMode) && updatedShowAllHeatmapColumns) {
        toggleBackground(`${settings.backgroundMode}-all`);
      } else if (
        ['heatmap-col-all', 'heatmap-all-all'].includes(settings.backgroundMode) &&
        !updatedShowAllHeatmapColumns
      ) {
        toggleBackground(settings.backgroundMode.substring(0, settings.backgroundMode.length - 4)); // trim off "-all"
      }
    }
    hideRibbonMenu();
  };

  return (
    <MenuItem
      className="hoverable"
      description={t('menu_description:show_all_heatmap')}
      onClick={updateShowAllHeatmapColumns}
    >
      <span className="toggler-action">
        <button className="btn btn-plain">
          <i
            className={`ico-check-box${showAllHeatmapColumns ? '' : '-outline-blank'}`}
            style={{ marginTop: '-.25em' }}
          />
          <span className="font-weight-bold" style={{ fontSize: '95%' }}>
            {t('Show All Heatmap Columns', { ns: 'menu' })}
          </span>
        </button>
      </span>
    </MenuItem>
  );
};

export default withTranslation(['menu', 'menu_description'])(ShowNonNumericHeatmapColumns);
