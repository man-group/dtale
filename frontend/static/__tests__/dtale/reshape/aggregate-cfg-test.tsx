import { validateAggregateCfg } from '../../../popups/reshape/Aggregate';
import { AggregationOperationType, ReshapeAggregateConfig } from '../../../popups/reshape/ReshapeState';

describe('Aggregate config validation', () => {
  it('validates configuration', () => {
    const cfg: ReshapeAggregateConfig = { agg: { type: AggregationOperationType.FUNC }, dropna: true };
    expect(validateAggregateCfg(cfg)).toBe(
      'Missing an aggregation selection! Please click "+" button next to Agg input.',
    );
    cfg.index = ['x'];
    cfg.agg = { type: AggregationOperationType.COL, cols: {} };
    expect(validateAggregateCfg(cfg)).toBe(
      'Missing an aggregation selection! Please click "+" button next to Agg input.',
    );
    cfg.agg.cols = { col1: ['count'] };
    expect(validateAggregateCfg(cfg)).toBeUndefined();
  });
});
