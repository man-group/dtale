import { act, fireEvent, RenderResult, screen } from '@testing-library/react';
import selectEvent from 'react-select-event';

import { OutputType } from '../../../popups/create/CreateColumnState';
import { AggregationOperationType, ReshapeType } from '../../../popups/reshape/ReshapeState';
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
    expect(spies.mockDispatch).toHaveBeenLastCalledWith(expect.objectContaining({ type: ActionType.CLOSE_CHART }));
  });

  it("reshapes data using aggregate 'By Column' w/ gmean", async () => {
    expect(screen.getByText('Agg:')).toBeDefined();
    await selectOption(result.container.getElementsByClassName('Select')[0] as HTMLElement, 'col1');
    await selectOption(result.container.getElementsByClassName('Select')[2] as HTMLElement, 'Geometric Mean');
    await selectOption(result.container.getElementsByClassName('Select')[1] as HTMLElement, 'col2');
    await act(async () => {
      fireEvent.click(result.container.getElementsByClassName('ico-add-circle')[0]);
    });
    await spies.validateCfg({
      cfg: {
        agg: { type: AggregationOperationType.COL, cols: { col2: ['gmean'] } },
        index: ['col1'],
        dropna: true,
      },
      type: ReshapeType.AGGREGATE,
      output: OutputType.NEW,
    });
  });

  it("reshapes data using aggregate 'By Column' w/ str_joiner", async () => {
    expect(screen.getByText('Agg:')).toBeDefined();
    await selectOption(result.container.getElementsByClassName('Select')[0] as HTMLElement, 'col1');
    await selectOption(result.container.getElementsByClassName('Select')[1] as HTMLElement, 'col3');
    await selectOption(result.container.getElementsByClassName('Select')[2] as HTMLElement, 'String Joiner');
    await act(async () => {
      fireEvent.click(result.container.getElementsByClassName('ico-add-circle')[0]);
    });
    await spies.validateCfg({
      cfg: {
        agg: { type: AggregationOperationType.COL, cols: { col3: ['str_joiner'] } },
        index: ['col1'],
        dropna: true,
      },
      type: ReshapeType.AGGREGATE,
      output: OutputType.NEW,
    });
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

  it("reshapes data using aggregate 'By Function' w/ Counts & Percentages", async () => {
    await act(async () => {
      fireEvent.click(screen.getByText('By Function'));
    });
    await selectOption(result.container.getElementsByClassName('Select')[0] as HTMLElement, 'col1');
    await selectOption(result.container.getElementsByClassName('Select')[1] as HTMLElement, 'Counts & Percentages');
    await selectOption(result.container.getElementsByClassName('Select')[2] as HTMLElement, 'col2');
    await act(async () => {
      fireEvent.click(screen.getByText('Override Current'));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Execute'));
    });

    await spies.validateCfg({
      cfg: {
        index: ['col1'],
        agg: { type: AggregationOperationType.FUNC, cols: ['col2'], func: 'count_pct' },
        dropna: true,
      },
      type: ReshapeType.AGGREGATE,
      output: OutputType.OVERRIDE,
    });
    expect(window.location.assign).toHaveBeenCalledWith('/dtale/main/2');
  });

  it('handles errors', async () => {
    await spies.validateError('Missing an aggregation selection! Please click "+" button next to Agg input.');
    await selectOption(result.container.getElementsByClassName('Select')[0] as HTMLElement, 'col1');
    await spies.validateError('Missing an aggregation selection! Please click "+" button next to Agg input.');
    await act(async () => {
      fireEvent.click(screen.getByText('By Function'));
    });
    await spies.validateError('Missing an aggregation selection! Please click "+" button next to Agg input.');
  });

  it('changes aggregation options based on unselected column', async () => {
    await act(async () => {
      await selectEvent.openMenu(document.body.getElementsByClassName('Select')[2] as HTMLElement);
    });
    expect([...document.body.getElementsByClassName('Select__option')].map((o) => o.textContent)).toEqual([
      'Count',
      'Unique Count',
      'Sum',
      'Mean',
      'Keep First',
      'Keep Last',
      'Median',
      'Minimum',
      'Maximum',
      'Standard Deviation',
      'Variance',
      'Mean Absolute Deviation',
      'Product of All Items',
      'Geometric Mean',
      'String Joiner',
    ]);
    await act(async () => {
      await selectEvent.clearFirst(document.body.getElementsByClassName('Select')[2] as HTMLElement);
    });
  });

  it('changes aggregation options based on float column', async () => {
    await selectOption(result.container.getElementsByClassName('Select')[1] as HTMLElement, 'col2');
    await act(async () => {
      await selectEvent.openMenu(document.body.getElementsByClassName('Select')[2] as HTMLElement);
    });
    expect([...document.body.getElementsByClassName('Select__option')].map((o) => o.textContent)).toEqual([
      'Count',
      'Unique Count',
      'Sum',
      'Mean',
      'Keep First',
      'Keep Last',
      'Median',
      'Minimum',
      'Maximum',
      'Standard Deviation',
      'Variance',
      'Mean Absolute Deviation',
      'Product of All Items',
      'Geometric Mean',
    ]);
    await act(async () => {
      await selectEvent.clearFirst(document.body.getElementsByClassName('Select')[2] as HTMLElement);
    });
  });

  it('changes aggregation options based on string column', async () => {
    await selectOption(result.container.getElementsByClassName('Select')[1] as HTMLElement, 'col3');
    await act(async () => {
      await selectEvent.openMenu(document.body.getElementsByClassName('Select')[2] as HTMLElement);
    });
    expect([...document.body.getElementsByClassName('Select__option')].map((o) => o.textContent)).toEqual([
      'Count',
      'Unique Count',
      'Keep First',
      'Keep Last',
      'String Joiner',
    ]);
    await act(async () => {
      await selectEvent.clearFirst(document.body.getElementsByClassName('Select')[2] as HTMLElement);
    });
  });
});
