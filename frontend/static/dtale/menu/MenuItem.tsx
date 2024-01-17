import { PayloadAction } from '@reduxjs/toolkit';
import * as React from 'react';

import { AppActions } from '../../redux/actions/AppActions';
import { useAppDispatch } from '../../redux/hooks';

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
  const dispatch = useAppDispatch();
  const showTooltip = (
    element: HTMLElement,
    content: React.ReactNode,
  ): PayloadAction<{
    element: HTMLElement;
    content: React.ReactNode;
  }> => dispatch(AppActions.ShowMenuTooltipAction({ element, content }));
  const hideTooltip = (): PayloadAction<void> => dispatch(AppActions.HideMenuTooltipAction());
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
