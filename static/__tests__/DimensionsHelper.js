export default class DimensionsHelper {
  constructor({ offsetWidth, offsetHeight, innerWidth, innerHeight }) {
    this.originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
    this.originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
    this.originalInnerWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerWidth");
    this.originalInnerHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerHeight");
    this.offsetWidth = offsetWidth;
    this.offsetHeight = offsetHeight;
    this.innerWidth = innerWidth;
    this.innerHeight = innerHeight;
  }

  beforeAll() {
    if (this.offsetHeight !== undefined) {
      Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
        configurable: true,
        value: this.offsetHeight,
      });
    }
    if (this.offsetWidth !== undefined) {
      Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
        configurable: true,
        value: this.offsetWidth,
      });
    }
    if (this.innerWidth !== undefined) {
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: this.innerWidth,
      });
    }
    if (this.innerHeight !== undefined) {
      Object.defineProperty(window, "innerHeight", {
        configurable: true,
        value: this.innerHeight,
      });
    }
  }

  afterAll() {}
}
