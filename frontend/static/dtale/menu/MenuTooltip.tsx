import { createSelector } from '@reduxjs/toolkit';
import * as React from 'react';
import { shallowEqual, useSelector } from 'react-redux';

import { usePrevious } from '../../customHooks';
import { AppState, MenuTooltipProps } from '../../redux/state/AppState';

const selectMenuPinned = (state: AppState): boolean => state.menuPinned;
const selectMenuTooltip = (state: AppState): MenuTooltipProps => state.menuTooltip;
const selectMenuTooltipElement = createSelector([selectMenuTooltip], (menuTooltip) => menuTooltip.element);
const selectMenuTooltipContent = createSelector([selectMenuTooltip], (menuTooltip) => menuTooltip.content);
const selectMenuTooltipVisible = createSelector([selectMenuTooltip], (menuTooltip) => menuTooltip.visible);
const selectMenuTooltipElementRect = createSelector([selectMenuTooltipElement], (element) => {
  if (element) {
    const { top, left, width, height } = element.getBoundingClientRect();
    return { top, left, width, height };
  }
  return undefined;
});

const selectMenuTooltipProps = createSelector(
  [selectMenuPinned, selectMenuTooltipVisible, selectMenuTooltipElementRect, selectMenuTooltipContent],
  (menuPinned: boolean, visible: boolean, elementRect?: Record<string, number>, content?: React.ReactNode) => ({
    menuPinned: menuPinned,
    elementRect,
    content,
    visible,
  }),
);

export const MenuTooltip: React.FC = () => {
  const { menuPinned, elementRect, content, visible } = useSelector(selectMenuTooltipProps, shallowEqual);
  const [style, setStyle] = React.useState<React.CSSProperties>({ display: 'none' });
  const [bottom, setBottom] = React.useState(false);
  const [right, setRight] = React.useState(false);

  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const lastElementRect = usePrevious(elementRect);
  const lastStyle = usePrevious(style);

  const checkForWindowEdge = (): void => {
    if (lastElementRect && tooltipRef.current) {
      let top = lastElementRect.top - (menuPinned ? 0 : lastElementRect.height - 26);
      const tooltipRect = tooltipRef.current?.getBoundingClientRect();
      const updatedStyle = { ...style };
      const currLeft = Number(updatedStyle.left ?? 0);
      let updatedBottom = false;
      let updatedRight = false;
      // handle the case when you're getting close to the bottom of the screen.
      if (top + tooltipRect.height > window.innerHeight) {
        top = lastElementRect.top - tooltipRect.height - lastElementRect.height / 3;
        updatedStyle.top = `calc(${top}px + 2em)`;
        updatedBottom = true;
      }
      // 320 => 20em (tooltip width)
      if (currLeft + 260 > window.innerWidth) {
        updatedStyle.left = lastElementRect.left - 260 - 8;
        updatedRight = true;
      }
      setStyle(updatedStyle);
      setBottom(updatedBottom);
      setRight(updatedRight);
    }
  };

  const computeStyle = (): void => {
    if (visible && elementRect) {
      const rect = elementRect;
      const top = rect.top - (menuPinned ? 0 : rect.height - 26);
      setStyle({ display: 'block', top, left: rect.left + rect.width + 8 });
    } else {
      setStyle({ display: 'none' });
      setBottom(false);
      setRight(false);
    }
  };

  React.useEffect(() => computeStyle(), [visible, elementRect?.top, elementRect?.left]);

  React.useEffect(() => {
    if (lastStyle?.display === 'none') {
      checkForWindowEdge();
    }
  }, [JSON.stringify(style)]);

  return (
    <div
      className={`hoverable__content menu-description${bottom ? ' bottom' : ''}${right ? ' right' : ''}`}
      style={style}
      ref={tooltipRef}
    >
      {content}
    </div>
  );
};
