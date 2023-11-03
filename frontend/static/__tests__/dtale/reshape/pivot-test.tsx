import { act, fireEvent, RenderResult, screen } from '@testing-library/react';

import { OutputType } from '../../../popups/create/CreateColumnState';
import { validatePivotCfg } from '../../../popups/reshape/Pivot';
import { ReshapePivotConfig, ReshapeType } from '../../../popups/reshape/ReshapeState';
import { selectOption } from '../../test-utils';

import * as TestSupport from './Reshape.test.support';

describe('Pivot', () => {
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
    await spies.clickBuilder('Pivot');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => {
    window.location = location;
    window.open = open;
    window.opener = opener;
    spies.afterAll();
  });

  const findSelects = (): HTMLCollectionOf<Element> => result.container.getElementsByClassName('Select');

  it('reshapes data using pivot', async () => {
    expect(findSelects()).toHaveLength(4);
    await selectOption(findSelects()[0] as HTMLElement, 'col1');
    await selectOption(findSelects()[1] as HTMLElement, 'col2');
    await selectOption(findSelects()[2] as HTMLElement, 'col3');
    await selectOption(findSelects()[3] as HTMLElement, 'Count');
    await act(async () => {
      fireEvent.click(screen.getByText('Override Current'));
    });
    await spies.validateCfg({
      cfg: {
        index: ['col1'],
        columns: ['col2'],
        values: ['col3'],
        aggfunc: 'count',
        columnNameHeaders: false,
      },
      type: ReshapeType.PIVOT,
      output: OutputType.OVERRIDE,
    });
    expect(window.location.assign).toHaveBeenCalledWith('/dtale/main/2');
  });

  it('handles errors', async () => {
    await spies.validateError('Missing an index selection!');
    await selectOption(findSelects()[0] as HTMLElement, 'col1');
    await spies.validateError('Missing a columns selection!');
    await selectOption(findSelects()[1] as HTMLElement, 'col2');
    await spies.validateError('Missing a value(s) selection!');
  });

  it('validates configuration', () => {
    const cfg: ReshapePivotConfig = { columnNameHeaders: false };
    expect(validatePivotCfg(cfg)).toBe('Missing an index selection!');
    cfg.index = ['x'];
    expect(validatePivotCfg(cfg)).toBe('Missing a columns selection!');
    cfg.columns = ['y'];
    expect(validatePivotCfg(cfg)).toBe('Missing a value(s) selection!');
    cfg.values = ['z'];
    expect(validatePivotCfg(cfg)).toBeUndefined();
  });
});
