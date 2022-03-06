import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { ActionMeta, default as Select } from 'react-select';

import {
  BaseCreateComponentProps,
  ConcatenationConfig,
  CreateColumnType,
  OperandDataType,
} from '../../../popups/create/CreateColumnState';
import { CreateConcatenate, validateConcatenateCfg } from '../../../popups/create/CreateConcatenate';
import { mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateConcatenate', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  const findConcatenateInputs = (): ReactWrapper<BaseCreateComponentProps, Record<string, any>> =>
    result.find(CreateConcatenate).first();
  const findLeftInputs = (): ReactWrapper => findConcatenateInputs().find('div.form-group').first();
  const simulateClick = async (btn: ReactWrapper): Promise<ReactWrapper> => {
    await act(async () => {
      btn.simulate('click');
    });
    return result.update();
  };

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    result = await spies.clickBuilder(result, 'Concatenate');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('builds concatenate column', async () => {
    expect(result.find(CreateConcatenate)).toHaveLength(1);
    await act(async () => {
      result
        .find('div.form-group')
        .first()
        .find('input')
        .first()
        .simulate('change', { target: { value: 'numeric_col' } });
    });
    result = result.update();
    await simulateClick(findLeftInputs().find('button').first());
    await simulateClick(findLeftInputs().find('button').last());
    await simulateClick(findLeftInputs().find('button').first());
    await act(async () => {
      findLeftInputs()
        .find(Select)
        .first()
        .props()
        .onChange?.({ value: 'col1' }, {} as ActionMeta<unknown>);
    });
    result = result.update();
    await act(async () => {
      findConcatenateInputs()
        .find('div.form-group')
        .last()
        .find(Select)
        .first()
        .props()
        .onChange?.({ value: 'col2' }, {} as ActionMeta<unknown>);
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: {
        left: { col: 'col1', type: OperandDataType.COL },
        right: { col: 'col2', type: OperandDataType.COL },
      },
      name: 'numeric_col',
      type: CreateColumnType.CONCATENATE,
    });
  });

  it('validation configuration', () => {
    const cfg: ConcatenationConfig = { left: { type: OperandDataType.COL }, right: { type: OperandDataType.COL } };
    expect(validateConcatenateCfg(t, cfg)).toBe('Left side is missing a column selection!');
    cfg.left = { type: OperandDataType.VAL };
    expect(validateConcatenateCfg(t, cfg)).toBe('Left side is missing a static value!');
    cfg.left = { type: OperandDataType.VAL, val: 'x' };
    cfg.right = { type: OperandDataType.COL };
    expect(validateConcatenateCfg(t, cfg)).toBe('Right side is missing a column selection!');
    cfg.right = { type: OperandDataType.VAL };
    expect(validateConcatenateCfg(t, cfg)).toBe('Right side is missing a static value!');
  });
});
