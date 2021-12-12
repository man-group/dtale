import mockPopsicle from './MockPopsicle';
import { createMockComponent } from './mocks/createMockComponent';
import { buildInnerHTML } from './test-utils';

require('react');

jest.mock('../i18n', () => ({}));

describe('main tests', () => {
  const { location, open, top, self, opener } = window;

  beforeEach(() => {
    jest.resetModules();
    mockPopsicle();

    jest.mock('@blueprintjs/datetime', () => ({ DateInput: createMockComponent('DateInput') }));
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

    const ReactDOM = require('react-dom');
    const renderSpy = jest.spyOn(ReactDOM, 'render');
    renderSpy.mockImplementation(() => undefined);
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
    'correlations',
    'charts',
    'describe',
    'column-analysis',
    'instances',
    'code-export',
    'filter',
    'type-conversion',
  ].concat(['cleaners', 'upload', 'merge', 'pps', 'variance', 'build', 'duplicates', 'replacement', 'reshape']);

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
