import 'regenerator-runtime/runtime';

import ReactSeventeenAdapter from '@wojtekmaj/enzyme-adapter-react-17';
import { configure } from 'enzyme';

configure({ adapter: new ReactSeventeenAdapter() });

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

// this is required for webpack dynamic public path setup
(global as any).__webpack_public_path__ = '';
