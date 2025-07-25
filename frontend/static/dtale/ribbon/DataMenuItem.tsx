import { PayloadAction } from '@reduxjs/toolkit';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import { getLocation } from '../../location';
import { AppActions } from '../../redux/actions/AppActions';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { selectIFrame } from '../../redux/selectors';

/** Component properties for DataMenuItem */
export interface DataMenuItemProps {
  id: string;
  name?: string;
  cleanup: (id: string) => void;
}

const DataMenuItem: React.FC<DataMenuItemProps & WithTranslation> = ({ id, name, cleanup, t }) => {
  const iframe = useAppSelector(selectIFrame);
  const dispatch = useAppDispatch();
  const showTooltip = (
    element: HTMLElement,
    content: React.ReactNode,
  ): PayloadAction<{
    element: HTMLElement;
    content: React.ReactNode;
  }> => dispatch(AppActions.ShowMenuTooltipAction({ element, content }));
  const hideTooltip = (): PayloadAction<void> => dispatch(AppActions.HideMenuTooltipAction());
  const hideRibbonMenu = (): PayloadAction<void> => dispatch(AppActions.HideRibbonMenuAction());
  const liRef = React.useRef<HTMLLIElement>(null);

  const onClick = (func: () => void): void => {
    func();
    hideRibbonMenu();
  };

  const viewData = (): void => {
    const currentHost = getLocation().origin;
    const newLoc = `${currentHost}/dtale/${iframe ? 'iframe' : 'main'}/${id}`;
    getLocation().assign(newLoc);
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
