import axios from 'axios';

import reduxUtils from './redux-test-utils';
import { buildInnerHTML } from './test-utils';

jest.mock('../dtale/DataViewer', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return { DataViewer: createMockComponent('DataViewer') };
});
jest.mock('../popups/analysis/ColumnAnalysis', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return {
    __esModule: true,
    default: createMockComponent('ColumnAnalysis'),
  };
});
jest.mock('../popups/CodeExport', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return { CodeExport: createMockComponent('CodeExport') };
});
jest.mock('../popups/CodePopup', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return { __esModule: true, default: createMockComponent('CodePopup') };
});
jest.mock('../popups/correlations/Correlations', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return { Correlations: createMockComponent('Correlations') };
});
jest.mock('../popups/create/CreateColumn', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return { __esModule: true, default: createMockComponent('CreateColumn') };
});
jest.mock('../popups/describe/Describe', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return { __esModule: true, default: createMockComponent('Describe') };
});
jest.mock('../popups/duplicates/Duplicates', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return { __esModule: true, default: createMockComponent('Duplicates') };
});
jest.mock('../popups/filter/FilterPopup', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return { __esModule: true, default: createMockComponent('FilterPopup') };
});
jest.mock('../popups/instances/Instances', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return { __esModule: true, default: createMockComponent('Instances') };
});
jest.mock('../popups/merge/MergeDatasets', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return { __esModule: true, default: createMockComponent('MergeDatasets') };
});
jest.mock('../popups/pps/PredictivePowerScore', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return {
    __esModule: true,
    default: createMockComponent('PredictivePowerScore'),
  };
});
jest.mock('../popups/replacement/CreateReplacement', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return {
    __esModule: true,
    default: createMockComponent('CreateReplacement'),
  };
});
jest.mock('../popups/reshape/Reshape', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return { __esModule: true, default: createMockComponent('Reshape') };
});
jest.mock('../popups/upload/Upload', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return { __esModule: true, default: createMockComponent('Upload') };
});
jest.mock('../popups/variance/Variance', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return { __esModule: true, default: createMockComponent('Variance') };
});
jest.mock('../popups/replacement/CreateReplacement', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return {
    __esModule: true,
    default: createMockComponent('CreateReplacement'),
  };
});

require('react');

jest.mock('../i18n', () => ({}));

describe('main tests', () => {
  const { location, open, top, self, opener } = window;

  beforeEach(() => {
    jest.resetModules();
    (axios.get as any).mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));

    jest.mock('@blueprintjs/datetime2', () => {
      const { createMockComponent } = require('./mocks/createMockComponent');
      return { DateInput2: createMockComponent('DateInput2') };
    });
  });

  beforeAll(() => {
    delete (window as any).location;
    delete (window as any).open;
    delete (window as any).top;
    delete (window as any).self;
    delete window.opener;
    (window as any).location = { reload: jest.fn(), pathname: '/dtale/iframe/1' };
    window.open = jest.fn();
    (window as any).top = { location: { href: 'http://test.com' } };
    (window as any).self = { location: { href: 'http://test/dtale/iframe' } };
    window.opener = { code_popup: { code: 'test code', title: 'Test' } };
  });

  afterAll(() => {
    window.location = location;
    window.open = open;
    (window as any).top = top;
    (window as any).self = self;
    window.opener = opener;
  });

  afterEach(jest.restoreAllMocks);

  const testMain = (mainName: string, search = '?', fname = 'main'): void => {
    (window as any).location = { pathname: `/dtale/${mainName}/1`, search };
    buildInnerHTML();

    const ReactDOMClient = require('react-dom/client');
    const renderSpy = jest.spyOn(ReactDOMClient, 'createRoot');
    renderSpy.mockImplementation(() => ({ render: () => undefined }));
    require(`../${fname}`);
    expect(renderSpy).toHaveBeenCalledTimes(1);
  };

  it('base_styles.js loading', () => {
    require('../base_styles');
    return;
  });

  it('polyfills.js loading', () => {
    const mockES6Promise = { polyfill: () => undefined };
    jest.mock('es6-promise', () => mockES6Promise);
    jest.mock('string.prototype.startswith', () => ({}));
    require('../polyfills');
  });

  it('main rendering', () => testMain('main'));

  it('network main rendering', () => testMain('network/1', '?', 'network/main'));

  it('correlations_popup_main rendering', () => {
    (window as any).location = { pathname: '/dtale/popup/correlations/1' };
    testMain('popup/correlations');
  });

  const popupCodes = [
    ...[
      'correlations',
      'charts',
      'describe',
      'column-analysis',
      'instances',
      'code-export',
      'filter',
      'type-conversion',
    ],
    ...['cleaners', 'upload', 'merge', 'pps', 'variance', 'build', 'duplicates', 'replacement', 'reshape'],
  ];

  popupCodes.forEach((popup) => {
    it(`${popup} popup rendering`, () => {
      testMain(`popup/${popup}`);
    });
  });

  it('code snippet rendering', () => {
    testMain('code-popup');
  });

  it('code snippet without parent rendering', () => {
    window.opener = null;
    testMain('code-popup');
  });
});
