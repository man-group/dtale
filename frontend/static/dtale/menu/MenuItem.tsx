import * as React from 'react';
import { useDispatch } from 'react-redux';

import { ActionType, HideMenuTooltipAction, ShowMenuTooltipAction } from '../../redux/actions/AppActions';

/** Component properties for MenuItem */
interface MenuItemProps {
  description?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const MenuItem: React.FC<React.PropsWithChildren<MenuItemProps>> = ({
  className = 'hoverable',
  style,
  onClick,
  description,
  children,
}) => {
  const dispatch = useDispatch();
  const showTooltip = (element: HTMLLIElement, content: React.ReactNode): ShowMenuTooltipAction =>
    dispatch({ type: ActionType.SHOW_MENU_TOOLTIP, element, content });
  const hideTooltip = (): HideMenuTooltipAction => dispatch({ type: ActionType.HIDE_MENU_TOOLTIP });
  const ref = React.useRef<HTMLLIElement>(null);

  const props: React.HTMLAttributes<HTMLLIElement> = { className, style };
  if (onClick) {
    props.onClick = () => {
      hideTooltip();
      onClick();
    };
    props.className = `${className} clickable-menu-item`;
  }
  if (description) {
    props.onMouseOver = () => showTooltip(ref.current!, description);
    props.onMouseLeave = hideTooltip;
  }
  return (
    <li ref={ref} {...props} data-testid="menu-item">
      {children}
    </li>
  );
};
