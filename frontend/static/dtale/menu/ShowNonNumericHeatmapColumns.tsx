import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { ActionType, HideRibbonMenuAction } from '../../redux/actions/AppActions';
import * as actions from '../../redux/actions/dtale';
import { AppState } from '../../redux/state/AppState';

import { MenuItem } from './MenuItem';

/** Component properties for ShowNonNumericHeatmapColumns */
export interface ShowNonNumericHeatmapColumnsProps {
  backgroundMode?: string;
  toggleBackground: (backgroundMode: string) => () => void;
}

const ShowNonNumericHeatmapColumns: React.FC<ShowNonNumericHeatmapColumnsProps & WithTranslation> = ({
  backgroundMode,
  toggleBackground,
  t,
}) => {
  const showAllHeatmapColumns = useSelector((state: AppState) => state.showAllHeatmapColumns);
  const dispatch = useDispatch();
  const hideRibbonMenu = (): HideRibbonMenuAction => dispatch({ type: ActionType.HIDE_RIBBON_MENU });

  const updateShowAllHeatmapColumns = (): void => {
    const updatedShowAllHeatmapColumns = !showAllHeatmapColumns;
    dispatch(actions.updateShowAllHeatmapColumns(updatedShowAllHeatmapColumns));
    if (backgroundMode) {
      if (['heatmap-col', 'heatmap-all'].includes(backgroundMode) && updatedShowAllHeatmapColumns) {
        toggleBackground(`${backgroundMode}-all`)();
      } else if (['heatmap-col-all', 'heatmap-all-all'].includes(backgroundMode) && !updatedShowAllHeatmapColumns) {
        toggleBackground(backgroundMode.substring(0, backgroundMode.length - 4))(); // trim off "-all"
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
