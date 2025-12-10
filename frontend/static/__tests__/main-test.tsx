import { render } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';

import App from '../app';
import * as windowUtils from '../location';

import reduxUtils from './redux-test-utils';
import { buildInnerHTML } from './test-utils';

jest.mock('../dtale/DataViewer', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return { DataViewer: createMockComponent('DataViewer', () => 'DataViewer') };
});
jest.mock('../popups/analysis/ColumnAnalysis', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return {
    __esModule: true,
    default: createMockComponent('ColumnAnalysis', () => 'ColumnAnalysis'),
  };
});
jest.mock('../popups/arcticdb/LibrarySymbolSelector', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return {
    __esModule: true,
    default: createMockComponent('LibrarySymbolSelector', () => 'LibrarySymbolSelector'),
  };
});
jest.mock('../popups/CodeExport', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return { CodeExport: createMockComponent('CodeExport', () => 'CodeExport') };
});
jest.mock('../popups/CodePopup', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return { __esModule: true, default: createMockComponent('CodePopup', () => 'CodePopup') };
});
jest.mock('../popups/correlations/Correlations', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return { Correlations: createMockComponent('Correlations', () => 'Correlations') };
});
jest.mock('../popups/create/CreateColumn', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return { __esModule: true, default: createMockComponent('CreateColumn', () => 'CreateColumn') };
});
jest.mock('../popups/describe/Describe', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return { __esModule: true, default: createMockComponent('Describe', () => 'Describe') };
});
jest.mock('../popups/duplicates/Duplicates', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return { __esModule: true, default: createMockComponent('Duplicates', () => 'Duplicates') };
});
jest.mock('../popups/filter/FilterPopup', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return { __esModule: true, default: createMockComponent('FilterPopup', () => 'FilterPopup') };
});
jest.mock('../popups/instances/Instances', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return { __esModule: true, default: createMockComponent('Instances', () => 'Instances') };
});
jest.mock('../popups/merge/MergeDatasets', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return { __esModule: true, default: createMockComponent('MergeDatasets', () => 'MergeDatasets') };
});
jest.mock('../popups/pps/PredictivePowerScore', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return {
    __esModule: true,
    default: createMockComponent('PredictivePowerScore', () => 'PredictivePowerScore'),
  };
});
jest.mock('../popups/replacement/CreateReplacement', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return {
    __esModule: true,
    default: createMockComponent('CreateReplacement', () => 'CreateReplacement'),
  };
});
jest.mock('../popups/reshape/Reshape', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return { __esModule: true, default: createMockComponent('Reshape', () => 'Reshape') };
});
jest.mock('../popups/upload/Upload', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return { __esModule: true, default: createMockComponent('Upload', () => 'Upload') };
});
jest.mock('../popups/variance/Variance', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return { __esModule: true, default: createMockComponent('Variance', () => 'Variance') };
});
jest.mock('../popups/replacement/CreateReplacement', () => {
  const { createMockComponent } = require('./mocks/createMockComponent');
  return {
    __esModule: true,
    default: createMockComponent('CreateReplacement', () => 'CreateReplacement'),
  };
});

require('react');

jest.mock('../i18n', () => ({}));

describe('main tests', () => {
  const { open, top, self, opener } = window;
  const reloadSpy = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    (axios.get as any).mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));

    jest.mock('@blueprintjs/datetime', () => {
      const { createMockComponent } = require('./mocks/createMockComponent');
      return { DateInput: createMockComponent('DateInput') };
    });
    jest.spyOn(windowUtils, 'getLocation').mockReturnValue({
      reload: reloadSpy,
      pathname: '/dtale/iframe/1',
    } as any);
  });

  beforeAll(() => {
    delete (window as any).open;
    delete (window as any).top;
    delete (window as any).self;
    delete window.opener;
    window.open = jest.fn();
    (window as any).top = { location: { href: 'http://test.com' } };
    (window as any).self = { location: { href: 'http://test/dtale/iframe' } };
    window.opener = { code_popup: { code: 'test code', title: 'Test' } };
  });

  afterAll(() => {
    window.open = open;
    (window as any).top = top;
    (window as any).self = self;
    window.opener = opener;
    jest.restoreAllMocks();
  });

  afterEach(jest.resetAllMocks);

  const testMain = (mainName: string, search = '?', fname = 'main'): HTMLElement => {
    jest.spyOn(windowUtils, 'getLocation').mockReturnValue({
      reload: reloadSpy,
      pathname: `/dtale/${mainName}/1`,
      search,
    } as any);
    buildInnerHTML();

    return render(<App pathname={`/dtale/${mainName}/1`} />).container;
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

  it('main rendering', () => {
    const result = testMain('main');
    expect(result.innerHTML).toBe('DataViewer');
  });

  it('correlations_popup_main rendering', () => {
    const result = testMain('popup/correlations');
    expect(result.innerHTML).toBe('Correlations');
  });

  it('describe rendering', () => {
    const result = testMain('popup/describe');
    expect(result.innerHTML).toBe('Describe');
  });

  it('column-analysis rendering', () => {
    const result = testMain('popup/column-analysis');
    expect(result.innerHTML).toBe('ColumnAnalysis');
  });

  it('instances rendering', () => {
    const result = testMain('popup/instances');
    expect(result.innerHTML).toBe('Instances');
  });

  it('code-export rendering', () => {
    const result = testMain('popup/code-export');
    expect(result.innerHTML).toBe('CodeExport');
  });

  it('filter rendering', () => {
    const result = testMain('popup/filter');
    expect(result.innerHTML).toBe('FilterPopup');
  });

  it('type-conversion rendering', () => {
    const result = testMain('popup/type-conversion');
    expect(result.innerHTML).toBe('CreateColumn');
  });

  it('cleaners rendering', () => {
    const result = testMain('popup/cleaners');
    expect(result.innerHTML).toBe('CreateColumn');
  });

  it('upload rendering', () => {
    const result = testMain('popup/upload');
    expect(result.innerHTML).toBe('Upload');
  });

  it('merge rendering', () => {
    const result = testMain('popup/merge');
    expect(result.innerHTML).toBe('MergeDatasets');
  });

  it('pps rendering', () => {
    const result = testMain('popup/pps');
    expect(result.innerHTML).toBe('PredictivePowerScore');
  });

  it('variance rendering', () => {
    const result = testMain('popup/variance');
    expect(result.innerHTML).toBe('Variance');
  });

  it('build rendering', () => {
    const result = testMain('popup/build');
    expect(result.innerHTML).toBe('CreateColumn');
  });

  it('duplicates rendering', () => {
    const result = testMain('popup/duplicates');
    expect(result.innerHTML).toBe('Duplicates');
  });

  it('replacement rendering', () => {
    const result = testMain('popup/replacement');
    expect(result.innerHTML).toBe('CreateReplacement');
  });

  it('reshape rendering', () => {
    const result = testMain('popup/reshape');
    expect(result.innerHTML).toBe('Reshape');
  });

  it('arcticdb rendering', () => {
    const result = testMain('popup/arcticdb');
    expect(result.innerHTML).toBe('LibrarySymbolSelector');
  });

  it('code snippet rendering', () => {
    const result = testMain('code-popup');
    expect(result.innerHTML).toBe('CodePopup');
  });

  it('code snippet without parent rendering', () => {
    window.opener = null;
    const result = testMain('code-popup');
    expect(result.innerHTML).toBe('<h1>No parent window containing code detected!</h1>');
  });
});
