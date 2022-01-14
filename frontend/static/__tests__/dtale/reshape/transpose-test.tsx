import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { default as Select } from 'react-select';

import { OutputType } from '../../../popups/create/CreateColumnState';
import { ReshapeTransposeConfig, ReshapeType } from '../../../popups/reshape/ReshapeState';
import { default as Transpose, validateTransposeCfg } from '../../../popups/reshape/Transpose';

import * as TestSupport from './Reshape.test.support';

describe('Transpose', () => {
  const { location, open, opener } = window;
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeAll(() => {
    delete (window as any).location;
    delete (window as any).open;
    delete (window as any).opener;
    (window as any).location = {
      reload: jest.fn(),
      pathname: '/dtale/column/1',
      href: '/dtale/main/1',
      assign: jest.fn(),
    };
    window.open = jest.fn();
    window.opener = { code_popup: { code: 'test code', title: 'Test' } };
  });

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    result = await spies.clickBuilder(result, 'Transpose');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => {
    window.location = location;
    window.open = open;
    window.opener = opener;
    spies.afterAll();
  });

  const findTranspose = (): ReactWrapper => result.find(Transpose);

  it('reshapes data using transpose', async () => {
    expect(findTranspose()).toHaveLength(1);
    await act(async () => {
      findTranspose()
        .find(Select)
        .first()
        .props()
        .onChange([{ value: 'col1' }]);
    });
    result = result.update();
    await act(async () => {
      findTranspose()
        .find(Select)
        .last()
        .props()
        .onChange([{ value: 'col2' }]);
    });
    result = result.update();
    await act(async () => {
      result.find('div.modal-body').find('div.row').last().find('button').last().simulate('click');
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: { index: ['col1'], columns: ['col2'] },
      type: ReshapeType.TRANSPOSE,
      output: OutputType.OVERRIDE,
    });
    expect(window.location.assign).toHaveBeenCalledWith('/dtale/main/2');
  });

  it('handles errors', async () => {
    result = await spies.validateError(result, 'Missing an index selection!');
  });

  it('validates configuration', () => {
    const cfg: ReshapeTransposeConfig = {};
    expect(validateTransposeCfg(cfg)).toBe('Missing an index selection!');
    cfg.index = ['x'];
    expect(validateTransposeCfg(cfg)).toBeUndefined();
  });
});
