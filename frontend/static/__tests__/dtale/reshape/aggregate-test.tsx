import { act, fireEvent, RenderResult, screen } from '@testing-library/react';

import { OutputType } from '../../../popups/create/CreateColumnState';
import { validateAggregateCfg } from '../../../popups/reshape/Aggregate';
import { AggregationOperationType, ReshapeAggregateConfig, ReshapeType } from '../../../popups/reshape/ReshapeState';
import { ActionType } from '../../../redux/actions/AppActions';
import { selectOption } from '../../test-utils';

import * as TestSupport from './Reshape.test.support';

describe('Aggregate', () => {
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
    await spies.clickBuilder('GroupBy');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => {
    window.location = location;
    window.open = open;
    window.opener = opener;
    spies.afterAll();
  });

  it("reshapes data using aggregate 'By Column'", async () => {
    expect(screen.getByText('Agg:')).toBeDefined();
    await selectOption(result.container.getElementsByClassName('Select')[0] as HTMLElement, 'col1');
    await selectOption(result.container.getElementsByClassName('Select')[2] as HTMLElement, 'Count');
    await selectOption(result.container.getElementsByClassName('Select')[1] as HTMLElement, 'col2');
    await act(async () => {
      fireEvent.click(result.container.getElementsByClassName('ico-check-box')[0]);
    });
    await act(async () => {
      fireEvent.click(result.container.getElementsByClassName('ico-add-circle')[0]);
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Override Current'));
    });
    await spies.validateCfg({
      cfg: {
        agg: { type: AggregationOperationType.COL, cols: { col2: ['count'] } },
        index: ['col1'],
        dropna: false,
      },
      type: ReshapeType.AGGREGATE,
      output: OutputType.OVERRIDE,
    });
    expect(window.location.assign).toHaveBeenCalledWith('/dtale/main/2');

    await act(async () => {
      fireEvent.click(screen.getByText('New Instance'));
    });
    await spies.validateCfg({
      cfg: {
        agg: { type: AggregationOperationType.COL, cols: { col2: ['count'] } },
        index: ['col1'],
        dropna: false,
      },
      type: ReshapeType.AGGREGATE,
      output: OutputType.NEW,
    });
    expect(window.open).toHaveBeenCalledWith('/dtale/main/2', '_blank');
    expect(spies.mockDispatch).toHaveBeenLastCalledWith({ type: ActionType.CLOSE_CHART });
  });

  it("reshapes data using aggregate 'By Function'", async () => {
    await act(async () => {
      fireEvent.click(screen.getByText('By Function'));
    });
    await selectOption(result.container.getElementsByClassName('Select')[1] as HTMLElement, 'Count');
    await selectOption(result.container.getElementsByClassName('Select')[2] as HTMLElement, 'col1');
    await act(async () => {
      fireEvent.click(screen.getByText('Override Current'));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Execute'));
    });

    await spies.validateCfg({
      cfg: {
        agg: { type: AggregationOperationType.FUNC, cols: ['col1'], func: 'count' },
        dropna: true,
      },
      type: ReshapeType.AGGREGATE,
      output: OutputType.OVERRIDE,
    });
    expect(window.location.assign).toHaveBeenCalledWith('/dtale/main/2');
  });

  it('handles errors', async () => {
    await spies.validateError('Missing an aggregation selection!');
    await selectOption(result.container.getElementsByClassName('Select')[0] as HTMLElement, 'col1');
    await spies.validateError('Missing an aggregation selection!');
    await act(async () => {
      fireEvent.click(screen.getByText('By Function'));
    });
    await spies.validateError('Missing an aggregation selection!');
  });

  it('validates configuration', () => {
    const cfg: ReshapeAggregateConfig = { agg: { type: AggregationOperationType.FUNC }, dropna: true };
    expect(validateAggregateCfg(cfg)).toBe('Missing an aggregation selection!');
    cfg.index = ['x'];
    cfg.agg = { type: AggregationOperationType.COL, cols: {} };
    expect(validateAggregateCfg(cfg)).toBe('Missing an aggregation selection!');
    cfg.agg.cols = { col1: ['count'] };
    expect(validateAggregateCfg(cfg)).toBeUndefined();
  });
});
