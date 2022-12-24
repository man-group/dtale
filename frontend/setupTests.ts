/* eslint no-console: "off" */
/* eslint max-classes-per-file: "off" */
import '@testing-library/jest-dom';
import 'regenerator-runtime/runtime';
import { TextDecoder, TextEncoder } from 'util';

(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

// this file is compiled in an odd way so we need to mock it (react-syntax-highlighter)
jest.mock('react-syntax-highlighter/dist/esm/languages/hljs/python', () => ({
  __esModule: true,
  default: () => undefined,
}));
jest.mock('react-syntax-highlighter/dist/esm/styles/hljs/docco', () => ({ __esModule: true, default: {} }));
jest.mock('react-syntax-highlighter', () => {
  const { createMockComponent } = require('./static/__tests__/mocks/createMockComponent');
  const Light = createMockComponent('Light');
  Light.registerLanguage = () => undefined;
  return { Light };
});

// globally mock this until we actually start to test it
jest.mock('plotly.js-geo-dist-min', () => ({ newPlot: () => undefined }));

jest.mock('react-i18next', () => ({
  // this mock makes sure any components using the translate HoC receive the t function as a prop
  withTranslation: () => (Component: any) => {
    const convertKey = (key: string): string => {
      const keySegs = key.split(':');
      if (keySegs.length > 2) {
        keySegs.shift();
        return keySegs.join(':');
      } else if (keySegs.length === 2) {
        return keySegs.pop() ?? '';
      }
      return key;
    };
    Component.defaultProps = {
      ...Component.defaultProps,
      t: convertKey,
      i18n: {
        language: 'en',
        options: { resources: { en: {}, cn: {} } },
        changeLanguage: () => undefined,
      },
    };
    return Component;
  },
}));

jest.mock('chartjs-plugin-zoom', () => ({}));
jest.mock('@sgratzl/chartjs-chart-boxplot', () => ({ BoxController: {} }));
jest.mock('chart.js', () => ({
  /** Mock chart component */
  Chart: class MockChart {
    /** register placeholder */
    public static register(): void {
      // do nothing
    }
    /** destroy placeholder */
    public destroy(): void {
      // do nothing
    }
  },
}));

window.requestAnimationFrame = (callback) => window.setTimeout(callback, 0);
window.cancelAnimationFrame = (id) => {
  window.clearTimeout(id);
};

/**
 * Mocked ResizeObserver needed for react-slider
 */
class ResizeObserver {
  /** @override */
  public observe(): void {
    return;
  }
  /** @override */
  public unobserve(): void {
    return;
  }
  /** @override */
  public disconnect(): void {
    return;
  }
}

(window as any).ResizeObserver = ResizeObserver;

// this is required for webpack dynamic public path setup
(global as any).__webpack_public_path__ = '';

(global as any).IS_REACT_ACT_ENVIRONMENT = true;

const originalConsoleError = console.error;
console.error = (...args) => {
  const firstArg = args[0];
  if (
    typeof args[0] === 'string' &&
    (args[0].startsWith("Warning: It looks like you're using the wrong act()") ||
      firstArg.startsWith('Warning: The current testing environment is not configured to support act') ||
      firstArg.startsWith('Warning: You seem to have overlapping act() calls'))
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};
