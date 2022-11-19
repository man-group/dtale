import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import {
  ActionType,
  HideMenuTooltipAction,
  HideRibbonMenuAction,
  ShowMenuTooltipAction,
} from '../../redux/actions/AppActions';
import { AppState } from '../../redux/state/AppState';

/** Component properties for DataMenuItem */
export interface DataMenuItemProps {
  id: string;
  name?: string;
  cleanup: (id: string) => void;
}

const DataMenuItem: React.FC<DataMenuItemProps & WithTranslation> = ({ id, name, cleanup, t }) => {
  const iframe = useSelector((state: AppState) => state.iframe);
  const dispatch = useDispatch();
  const showTooltip = (element: HTMLLIElement, content: React.ReactNode): ShowMenuTooltipAction =>
    dispatch({ type: ActionType.SHOW_MENU_TOOLTIP, element, content });
  const hideTooltip = (): HideMenuTooltipAction => dispatch({ type: ActionType.HIDE_MENU_TOOLTIP });
  const hideRibbonMenu = (): HideRibbonMenuAction => dispatch({ type: ActionType.HIDE_RIBBON_MENU });
  const liRef = React.useRef<HTMLLIElement>(null);

  const onClick = (func: () => void): void => {
    func();
    hideRibbonMenu();
  };

  const viewData = (): void => {
    const currentHost = window.location.origin;
    const newLoc = `${currentHost}/dtale/${iframe ? 'iframe' : 'main'}/${id}`;
    window.location.assign(newLoc);
  };

  return (
    <li ref={liRef} className="hoverable" data-testid="data-menu-item">
      <button
        className="btn btn-plain toggler-action w-100 text-left pointer p-3"
        onMouseOver={() => showTooltip(liRef.current!, t('open_process'))}
        onMouseLeave={hideTooltip}
        onClick={() => onClick(viewData)}
      >
        <span className="font-weight-bold">{`${id}${name ? ` - ${name}` : ''}`}</span>
      </button>
      <i
        className="ico-delete mt-auto mb-auto pointer pr-3"
        onClick={() => onClick(() => cleanup(id))}
        onMouseOver={() => showTooltip(liRef.current!, t('clear_data'))}
        onMouseLeave={hideTooltip}
        data-testid="data-menu-item-cleanup"
      />
    </li>
  );
};

export default withTranslation('menu_description')(DataMenuItem);
