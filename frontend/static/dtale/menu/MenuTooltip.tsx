import * as React from 'react';
import { useSelector } from 'react-redux';

import { usePrevious } from '../../customHooks';
import { AppState } from '../../redux/state/AppState';

export const MenuTooltip: React.FC = () => {
  const { menuPinned, element, content, visible } = useSelector((state: AppState) => ({
    menuPinned: state.menuPinned,
    ...state.menuTooltip,
  }));
  const [style, setStyle] = React.useState<React.CSSProperties>({ display: 'none' });
  const [bottom, setBottom] = React.useState(false);
  const [right, setRight] = React.useState(false);

  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const lastElementRect = usePrevious(element?.getBoundingClientRect());
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
    if (visible && element) {
      const rect = element.getBoundingClientRect();
      const top = rect.top - (menuPinned ? 0 : rect.height - 26);
      setStyle({ display: 'block', top, left: rect.left + rect.width + 8 });
    } else {
      setStyle({ display: 'none' });
      setBottom(false);
      setRight(false);
    }
  };

  React.useEffect(
    () => computeStyle(),
    [visible, element?.getBoundingClientRect()?.top, element?.getBoundingClientRect()?.left],
  );

  React.useEffect(() => {
    if (lastStyle?.display === 'none') {
      checkForWindowEdge();
    }
  }, [style]);

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
