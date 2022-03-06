import { ignoreMenuClicks } from '../../dtale/column/columnMenuUtils';

describe('ColumnMenu ignoreClicks tests', () => {
  let getElementsByClassNameSpy: jest.SpyInstance;

  beforeEach(() => {
    getElementsByClassNameSpy = jest.spyOn(document, 'getElementsByClassName');
  });

  afterEach(jest.restoreAllMocks);

  it("ColumnMenu: make sure clicks into column-filter won't close the menu", () => {
    getElementsByClassNameSpy.mockImplementation(() => [{ contains: () => true }]);
    expect(ignoreMenuClicks({ target: { id: 'pass' } } as any as MouseEvent)).toBe(true);
  });

  it("ColumnMenu: make sure clicks into Select__option won't close the menu", () => {
    getElementsByClassNameSpy.mockImplementation(() => [{ contains: () => false }]);
    expect(ignoreMenuClicks({ target: { classList: { contains: () => true } } } as any as MouseEvent)).toBe(true);
  });

  it("ColumnMenu: make sure clicks into ico-info won't close the menu", () => {
    getElementsByClassNameSpy.mockImplementation(() => []);
    expect(ignoreMenuClicks({ target: { classList: { contains: () => true } } } as any as MouseEvent)).toBe(true);
  });

  it("ColumnMenu: make sure clicks into svg nodes won't close the menu", () => {
    getElementsByClassNameSpy.mockImplementation(() => [{ contains: () => false }]);
    expect(
      ignoreMenuClicks({
        target: { nodeName: 'svg', classList: { contains: () => false } },
      } as any as MouseEvent),
    ).toBe(true);
  });

  it('ColumnMenu: make sure clicks anywhere else will close the menu', () => {
    getElementsByClassNameSpy.mockImplementation(() => []);
    expect(
      ignoreMenuClicks({
        target: { nodeName: 'span', classList: { contains: () => false } },
      } as any as MouseEvent),
    ).toBe(false);
  });
});
