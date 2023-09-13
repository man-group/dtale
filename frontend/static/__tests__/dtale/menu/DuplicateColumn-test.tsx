import * as serverState from '../../../dtale/serverStateManagement';
import { validateHeaders } from '../../iframe/iframe-utils';
import * as TestSupport from '../formatting/Formatting.test.support';

describe('DuplicateColumn', () => {
  const spies = new TestSupport.Spies();
  const { open } = window;
  const openFn = jest.fn();
  let duplicateColumnSpy: jest.SpyInstance;

  beforeAll(() => {
    spies.beforeAll();
    delete (window as any).open;
    window.open = openFn;
  });

  beforeEach(async () => {
    duplicateColumnSpy = jest.spyOn(serverState, 'duplicateColumn');
    duplicateColumnSpy.mockImplementation(() => Promise.resolve({ success: true, col: 'col2_2' }));
    spies.setupMockImplementations();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    spies.afterAll();
    window.open = open;
  });

  it('duplicates column', async () => {
    await spies.setupWrapper(1, 'Duplicate');
    validateHeaders(['col1', 'col2', 'col2_2', 'col3', 'col4']);
  });
});
