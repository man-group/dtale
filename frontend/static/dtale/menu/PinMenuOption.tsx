import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { ActionType, ToggleMenuPinnedAction } from '../../redux/actions/AppActions';
import { selectMenuPinned } from '../../redux/selectors';
import * as serverState from '../serverStateManagement';

import { MenuItem } from './MenuItem';

const PinMenuOption: React.FC<WithTranslation> = ({ t }) => {
  const menuPinned = useSelector(selectMenuPinned);
  const dispatch = useDispatch();
  const toggleMenuPinned = (): ToggleMenuPinnedAction => dispatch({ type: ActionType.TOGGLE_MENU_PINNED });

  const togglePinned = async (): Promise<void> => {
    await serverState.updatePinMenu(!menuPinned);
    toggleMenuPinned();
  };
  return (
    <MenuItem description={t('menu_description:pin_menu')} onClick={togglePinned}>
      <span className="toggler-action">
        <button className="btn btn-plain">
          <i className="fa fa-anchor la-lg mr-3 ml-1" />
          <span className="font-weight-bold">{t(menuPinned ? 'Unpin menu' : 'Pin menu', { ns: 'menu' })}</span>
        </button>
      </span>
    </MenuItem>
  );
};

export default withTranslation(['menu', 'menu_description'])(PinMenuOption);
