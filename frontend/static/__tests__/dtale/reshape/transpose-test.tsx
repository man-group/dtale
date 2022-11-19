import { act, fireEvent, RenderResult, screen } from '@testing-library/react';

import { OutputType } from '../../../popups/create/CreateColumnState';
import { ReshapeTransposeConfig, ReshapeType } from '../../../popups/reshape/ReshapeState';
import { validateTransposeCfg } from '../../../popups/reshape/Transpose';
import { selectOption } from '../../test-utils';

import * as TestSupport from './Reshape.test.support';

describe('Transpose', () => {
  const { location, open, opener } = window;
  const spies = new TestSupport.Spies();
  let result: RenderResult;

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
    await spies.clickBuilder('Transpose');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => {
    window.location = location;
    window.open = open;
    window.opener = opener;
    spies.afterAll();
  });

  const findSelects = (): HTMLCollectionOf<Element> => result.container.getElementsByClassName('Select');

  it('reshapes data using transpose', async () => {
    expect(findSelects()).toHaveLength(2);
    await selectOption(findSelects()[0] as HTMLElement, 'col1');
    await selectOption(findSelects()[1] as HTMLElement, 'col2');
    await act(async () => {
      fireEvent.click(screen.getByText('Override Current'));
    });
    await spies.validateCfg({
      cfg: { index: ['col1'], columns: ['col2'] },
      type: ReshapeType.TRANSPOSE,
      output: OutputType.OVERRIDE,
    });
    expect(window.location.assign).toHaveBeenCalledWith('/dtale/main/2');
  });

  it('handles errors', async () => {
    await spies.validateError('Missing an index selection!');
  });

  it('validates configuration', () => {
    const cfg: ReshapeTransposeConfig = {};
    expect(validateTransposeCfg(cfg)).toBe('Missing an index selection!');
    cfg.index = ['x'];
    expect(validateTransposeCfg(cfg)).toBeUndefined();
  });
});
