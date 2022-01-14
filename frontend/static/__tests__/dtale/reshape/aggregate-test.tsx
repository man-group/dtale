import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { default as Select } from 'react-select';

import { OutputType } from '../../../popups/create/CreateColumnState';
import { default as Aggregate, validateAggregateCfg } from '../../../popups/reshape/Aggregate';
import { AggregationOperationType, ReshapeAggregateConfig, ReshapeType } from '../../../popups/reshape/ReshapeState';

import * as TestSupport from './Reshape.test.support';

describe('Aggregate', () => {
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
    result = await spies.clickBuilder(result, 'GroupBy');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => {
    window.location = location;
    window.open = open;
    window.opener = opener;
    spies.afterAll();
  });

  const findAgg = (): ReactWrapper => result.find(Aggregate);

  const aggInputs = (): ReactWrapper => findAgg().find(Select);

  it("reshapes data using aggregate 'By Column'", async () => {
    expect(findAgg()).toHaveLength(1);
    await act(async () => {
      aggInputs()
        .find(Select)
        .first()
        .props()
        .onChange([{ value: 'col1' }]);
    });
    result = result.update();
    await act(async () => {
      aggInputs()
        .at(2)
        .find('input')
        .simulate('change', { target: { value: 'count' } });
    });
    result = result.update();
    await act(async () => {
      aggInputs().at(2).find('input').simulate('keyDown', { keyCode: 9, key: 'Tab' });
    });
    result = result.update();
    await act(async () => {
      aggInputs()
        .at(1)
        .find('input')
        .simulate('change', { target: [{ value: 'col2' }] });
    });
    result = result.update();
    await act(async () => {
      aggInputs().at(1).find('input').simulate('keyDown', { keyCode: 9, key: 'Tab' });
    });
    result = result.update();
    await act(async () => {
      findAgg().find('i').first().simulate('click');
    });
    result = result.update();
    await act(async () => {
      result.find('div.modal-body').find('div.row').last().find('button').last().simulate('click');
    });
    result = result.update();

    await spies.validateCfg(result, {
      cfg: {
        agg: { type: AggregationOperationType.COL, cols: { col2: ['count'] } },
        index: ['col1'],
      },
      type: ReshapeType.AGGREGATE,
      output: OutputType.OVERRIDE,
    });
    expect(window.location.assign).toHaveBeenCalledWith('/dtale/main/2');

    await act(async () => {
      result.find('div.modal-body').find('div.row').last().find('button').first().simulate('click');
    });
    result = result.update();

    await spies.validateCfg(result, {
      cfg: {
        agg: { type: AggregationOperationType.COL, cols: { col2: ['count'] } },
        index: ['col1'],
      },
      type: ReshapeType.AGGREGATE,
      output: OutputType.NEW,
    });
    expect(window.open).toHaveBeenCalledWith('/dtale/main/2', '_blank');
    expect(spies.onCloseSpy).toHaveBeenCalled();
  });

  it("reshapes data using aggregate 'By Function'", async () => {
    await act(async () => {
      aggInputs()
        .first()
        .simulate('change', { target: { value: 'col1' } });
    });
    result = result.update();
    await act(async () => {
      findAgg().find('button').last().simulate('click');
    });
    result = result.update();
    await act(async () => {
      aggInputs()
        .at(1)
        .find('input')
        .simulate('change', { target: { value: 'count' } });
    });
    result = result.update();
    await act(async () => {
      aggInputs().at(1).find('input').simulate('keyDown', { keyCode: 9, key: 'Tab' });
    });
    result = result.update();
    await act(async () => {
      aggInputs()
        .at(2)
        .find('input')
        .simulate('change', { target: { value: 'col2' } });
    });
    result = result.update();
    await act(async () => {
      aggInputs().at(2).find('input').simulate('keyDown', { keyCode: 9, key: 'Tab' });
    });
    result = result.update();
    await act(async () => {
      result.find('div.modal-body').find('div.row').last().find('button').last().simulate('click');
    });
    result = result.update();

    await spies.validateCfg(result, {
      cfg: {
        agg: { type: AggregationOperationType.FUNC, cols: ['col1'], func: 'count' },
      },
      type: ReshapeType.AGGREGATE,
      output: OutputType.OVERRIDE,
    });
    expect(window.location.assign).toHaveBeenCalledWith('/dtale/main/2');
  });

  it('handles errors', async () => {
    result = await spies.validateError(result, 'Missing an aggregation selection!');
    await act(async () => {
      aggInputs()
        .first()
        .simulate('change', { target: { value: 'col1' } });
    });
    result = result.update();
    result = await spies.validateError(result, 'Missing an aggregation selection!');
    await act(async () => {
      findAgg().find('button').last().simulate('click');
    });
    result = result.update();
    result = await spies.validateError(result, 'Missing an aggregation selection!');
  });

  it('validates configuration', () => {
    const cfg: ReshapeAggregateConfig = { agg: { type: AggregationOperationType.FUNC } };
    expect(validateAggregateCfg(cfg)).toBe('Missing an aggregation selection!');
    cfg.index = ['x'];
    cfg.agg = { type: AggregationOperationType.COL, cols: {} };
    expect(validateAggregateCfg(cfg)).toBe('Missing an aggregation selection!');
    cfg.agg.cols = { col1: ['count'] };
    expect(validateAggregateCfg(cfg)).toBeUndefined();
  });
});
