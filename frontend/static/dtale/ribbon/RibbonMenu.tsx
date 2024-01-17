import { createSelector, PayloadAction } from '@reduxjs/toolkit';
import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { AppActions } from '../../redux/actions/AppActions';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  selectHideHeaderMenu,
  selectMainTitle,
  selectMainTitleFont,
  selectRibbonDropdownName,
  selectRibbonMenuOpen,
} from '../../redux/selectors';
import { RibbonDropdownProps, RibbonDropdownType } from '../../redux/state/AppState';

require('./RibbonMenu.scss');

/** Component properties for RibbonMenuItem */
interface RibbonMenuItemProps {
  name: RibbonDropdownType;
  onClick: (name: RibbonDropdownType, element: HTMLDivElement) => void;
  onHover: (name: RibbonDropdownType, element: HTMLDivElement) => void;
  selected?: RibbonDropdownType;
}

export const RibbonMenuItem: React.FC<React.PropsWithChildren<RibbonMenuItemProps>> = ({
  name,
  onClick,
  onHover,
  selected,
  children,
}) => {
  const divRef = React.useRef<HTMLDivElement>(null);

  return (
    <div
      id={`ribbon-item-${name}`}
      className={`col-auto ribbon-menu-item${selected === name ? ' active' : ''}`}
      onClick={() => onClick(name, divRef.current!)}
      onMouseOver={() => onHover(name, divRef.current!)}
      ref={divRef}
    >
      {children}
    </div>
  );
};

const selectResult = createSelector(
  [selectRibbonMenuOpen, selectRibbonDropdownName, selectMainTitle, selectMainTitleFont, selectHideHeaderMenu],
  (visible, ribbonDropdown, mainTitle, mainTitleFont, hideHeaderMenu) => ({
    visible,
    ribbonDropdown,
    mainTitle,
    mainTitleFont,
    hideHeaderMenu,
  }),
);

const RibbonMenu: React.FC<WithTranslation> = ({ t }) => {
  const { visible, ribbonDropdown, mainTitle, mainTitleFont, hideHeaderMenu } = useAppSelector(selectResult);
  const titleStyle: React.CSSProperties = React.useMemo(
    () => ({ fontSize: '16px', cursor: 'default', ...(mainTitleFont ? { fontFamily: mainTitleFont } : {}) }),
    [mainTitleFont],
  );
  const dispatch = useAppDispatch();
  const openRibbonDropdown = (name: RibbonDropdownType, element: HTMLElement): PayloadAction<RibbonDropdownProps> =>
    dispatch(AppActions.OpenRibbonDropdownAction({ name, element, visible: true }));

  const [hoverActive, setHoverActive] = React.useState(false);

  React.useEffect(() => {
    if (!visible) {
      setHoverActive(false);
    }
  }, [visible]);

  const onHover = (name: RibbonDropdownType, element: HTMLDivElement): void => {
    if (hoverActive) {
      openRibbonDropdown(name, element);
    }
  };

  const onClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    e.preventDefault();
  };

  const menuClick = (name: RibbonDropdownType, element: HTMLDivElement): void => {
    openRibbonDropdown(name, element);
    setHoverActive(true);
  };

  if (hideHeaderMenu) {
    return null;
  }

  const itemProps = { onHover, onClick: menuClick, selected: ribbonDropdown };
  return (
    <div className={`ribbon-menu-content${visible ? ' is-expanded' : ''} row ml-0`} onClick={onClick}>
      <RibbonMenuItem name={RibbonDropdownType.MAIN} {...itemProps}>
        <span className={`${mainTitleFont ? '' : 'title-font '}title-font-base`} style={titleStyle}>
          {mainTitle ? mainTitle : 'D-TALE'}
        </span>
      </RibbonMenuItem>
      <RibbonMenuItem name={RibbonDropdownType.ACTIONS} {...itemProps}>
        <span className="align-middle">{t('Actions')}</span>
      </RibbonMenuItem>
      <RibbonMenuItem name={RibbonDropdownType.VISUALIZE} {...itemProps}>
        <span className="align-middle">{t('Visualize')}</span>
      </RibbonMenuItem>
      <RibbonMenuItem name={RibbonDropdownType.HIGHLIGHT} {...itemProps}>
        <span className="align-middle">{t('Highlight')}</span>
      </RibbonMenuItem>
      <RibbonMenuItem name={RibbonDropdownType.SETTINGS} {...itemProps}>
        <span className="align-middle">{t('Settings')}</span>
      </RibbonMenuItem>
    </div>
  );
};

export default withTranslation('menu')(RibbonMenu);
