import { positionMenu } from '../../dtale/column/columnMenuUtils';

describe('ColumnMenu position tests', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 310,
    });
    Object.defineProperty(document, 'styleSheets', {
      configurable: true,
      value: {
        1: { rules: [{ selectorText: '.column-toggle__dropdown::before' }] },
      },
    });
  });

  it('ColumnMenu: calculations for menus on edge of browser window...', () => {
    const menuDiv = { current: { getBoundingClientRect: () => ({ width: 20 }) } } as React.RefObject<HTMLDivElement>;
    let css = positionMenu({ getBoundingClientRect: () => ({ left: 90 }) } as HTMLElement, menuDiv);
    expect(css.left).toBe(60);
    css = positionMenu({ getBoundingClientRect: () => ({ left: 10 }) } as HTMLElement, menuDiv);
    expect(css.left).toBe(10);
    css = positionMenu({ getBoundingClientRect: () => ({ left: 15 }) } as HTMLElement, menuDiv);
    expect(css.left).toBe(15);
  });
});
