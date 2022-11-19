import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { ActionType, OpenRibbonDropdownAction } from '../../redux/actions/AppActions';
import { AppState, RibbonDropdownType } from '../../redux/state/AppState';

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

const RibbonMenu: React.FC<WithTranslation> = ({ t }) => {
  const { visible, ribbonDropdown, mainTitle, mainTitleFont } = useSelector((state: AppState) => ({
    visible: state.ribbonMenuOpen,
    ribbonDropdown: state.ribbonDropdown.name,
    mainTitle: state.mainTitle,
    mainTitleFont: state.mainTitleFont,
  }));
  const titleStyle: React.CSSProperties = React.useMemo(
    () => ({ fontSize: '16px', cursor: 'default', ...(mainTitleFont ? { fontFamily: mainTitleFont } : {}) }),
    [mainTitleFont],
  );
  const dispatch = useDispatch();
  const openRibbonDropdown = (name: RibbonDropdownType, element: HTMLDivElement): OpenRibbonDropdownAction =>
    dispatch({ type: ActionType.OPEN_RIBBON_DROPDOWN, name, element });

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
