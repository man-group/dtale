/** DimensionHelper properties */
interface DimensionsHelperProps {
  offsetWidth?: number;
  offsetHeight?: number;
  innerWidth?: number;
  innerHeight?: number;
}

/**
 * Helper class for managing browser dimensions. react-virtualized requires a certain amount of space for data to be loaded.
 */
export default class DimensionsHelper {
  private originalOffsetHeight: PropertyDescriptor | undefined;
  private originalOffsetWidth: PropertyDescriptor | undefined;
  private originalInnerWidth: PropertyDescriptor | undefined;
  private originalInnerHeight: PropertyDescriptor | undefined;
  private offsetWidth: number | undefined;
  private offsetHeight: number | undefined;
  private innerWidth: number | undefined;
  private innerHeight: number | undefined;

  /**
   * @class
   * @param props dimensions to override
   */
  public constructor(props: DimensionsHelperProps) {
    const { offsetWidth, offsetHeight, innerWidth, innerHeight } = props;
    this.originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
    this.originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
    this.originalInnerWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'innerWidth');
    this.originalInnerHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'innerHeight');
    this.offsetWidth = offsetWidth;
    this.offsetHeight = offsetHeight;
    this.innerWidth = innerWidth;
    this.innerHeight = innerHeight;
  }

  /** Helper to be called from jest.beforeAll. */
  public beforeAll(): void {
    if (this.offsetHeight !== undefined) {
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
        configurable: true,
        value: this.offsetHeight,
      });
    }
    if (this.offsetWidth !== undefined) {
      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
        configurable: true,
        value: this.offsetWidth,
      });
    }
    if (this.innerWidth !== undefined) {
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        value: this.innerWidth,
      });
    }
    if (this.innerHeight !== undefined) {
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: this.innerHeight,
      });
    }
  }

  /** Helper to be called from jest.afterAll. */
  public afterAll(): void {
    if (this.offsetHeight !== undefined) {
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
        configurable: true,
        value: this.originalOffsetHeight,
      });
    }
    if (this.offsetWidth !== undefined) {
      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
        configurable: true,
        value: this.originalOffsetWidth,
      });
    }
    if (this.innerWidth !== undefined) {
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        value: this.originalInnerWidth,
      });
    }
    if (this.innerHeight !== undefined) {
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: this.originalInnerHeight,
      });
    }
  }
}
