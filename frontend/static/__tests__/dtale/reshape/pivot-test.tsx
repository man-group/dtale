import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { default as Select } from 'react-select';

import { OutputType } from '../../../popups/create/CreateColumnState';
import { default as Pivot, validatePivotCfg } from '../../../popups/reshape/Pivot';
import { ReshapePivotConfig, ReshapeType } from '../../../popups/reshape/ReshapeState';

import * as TestSupport from './Reshape.test.support';

describe('Pivot', () => {
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
    result = await spies.clickBuilder(result, 'Pivot');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => {
    window.location = location;
    window.open = open;
    window.opener = opener;
    spies.afterAll();
  });

  const findPivot = (): ReactWrapper => result.find(Pivot);

  it('reshapes data using pivot', async () => {
    expect(findPivot()).toHaveLength(1);
    await act(async () => {
      findPivot()
        .find(Select)
        .first()
        .props()
        .onChange([{ value: 'col1' }]);
    });
    result = result.update();
    await act(async () => {
      findPivot()
        .find(Select)
        .at(1)
        .props()
        .onChange([{ value: 'col2' }]);
    });
    result = result.update();
    await act(async () => {
      findPivot()
        .find(Select)
        .at(2)
        .props()
        .onChange([{ value: 'col3' }]);
    });
    result = result.update();
    await act(async () => {
      findPivot().find(Select).last().props().onChange({ value: 'count' });
    });
    result = result.update();
    await act(async () => {
      result.find('div.modal-body').find('div.row').last().find('button').last().simulate('click');
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: {
        index: ['col1'],
        columns: ['col2'],
        values: ['col3'],
        func: 'count',
        columnNameHeaders: false,
      },
      type: ReshapeType.PIVOT,
      output: OutputType.OVERRIDE,
    });
    expect(window.location.assign).toHaveBeenCalledWith('/dtale/main/2');
  });

  it('handles errors', async () => {
    result = await spies.validateError(result, 'Missing an index selection!');
    await act(async () => {
      findPivot()
        .find(Select)
        .first()
        .props()
        .onChange([{ value: 'col1' }]);
    });
    result = result.update();
    result = await spies.validateError(result, 'Missing a columns selection!');
    await act(async () => {
      findPivot()
        .find(Select)
        .at(1)
        .props()
        .onChange([{ value: 'col2' }]);
    });
    result = result.update();
    result = await spies.validateError(result, 'Missing a value(s) selection!');
  });

  it('validates configuration', () => {
    const cfg: ReshapePivotConfig = { columnNameHeaders: false };
    expect(validatePivotCfg(cfg)).toBe('Missing an index selection!');
    cfg.index = ['x'];
    expect(validatePivotCfg(cfg)).toBe('Missing a columns selection!');
    cfg.columns = ['y'];
    expect(validatePivotCfg(cfg)).toBe('Missing a value(s) selection!');
    cfg.columns = ['z'];
    expect(validatePivotCfg(cfg)).toBeUndefined();
  });
});
