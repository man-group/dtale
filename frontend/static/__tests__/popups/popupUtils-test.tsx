import * as gu from '../../dtale/gridUtils';
import { buildBodyAndTitle } from '../../popups/popupUtils';
import { PopupType } from '../../redux/state/AppState';

describe('popupUtils', () => {
  const t = ((key: string) => key) as any;
  const propagateState = jest.fn();
  const mergeRefresher = jest.fn().mockResolvedValue(undefined);
  const dataId = '1';

  const buildProps = (type: PopupType, extraChartData: Record<string, any> = {}): Record<string, any> => ({
    propagateState,
    mergeRefresher,
    dataId,
    t,
    chartData: { type, visible: true, ...extraChartData },
  });

  it('builds filter popup', () => {
    const result = buildBodyAndTitle(buildProps(PopupType.FILTER) as any);
    expect(result.title).toBeDefined();
    expect(result.body).toBeDefined();
  });

  it('builds column analysis popup', () => {
    const result = buildBodyAndTitle(buildProps(PopupType.COLUMN_ANALYSIS, { selectedCol: 'col1' }) as any);
    expect(result.title).toBeDefined();
    expect(result.body).toBeDefined();
  });

  it('builds correlations popup', () => {
    const result = buildBodyAndTitle(buildProps(PopupType.CORRELATIONS, { title: 'Correlations' }) as any);
    expect(result.title).toBeDefined();
    expect(result.body).toBeDefined();
  });

  it('builds PPS popup', () => {
    const result = buildBodyAndTitle(buildProps(PopupType.PPS) as any);
    expect(result.title).toBeDefined();
    expect(result.body).toBeDefined();
  });

  it('builds create column popup', () => {
    const result = buildBodyAndTitle(buildProps(PopupType.BUILD) as any);
    expect(result.title).toBeDefined();
    expect(result.body).toBeDefined();
  });

  it('builds type conversion popup', () => {
    const result = buildBodyAndTitle(buildProps(PopupType.TYPE_CONVERSION, { selectedCol: 'col1' }) as any);
    expect(result.title).toBeDefined();
    expect(result.body).toBeDefined();
  });

  it('builds cleaners popup', () => {
    const result = buildBodyAndTitle(buildProps(PopupType.CLEANERS, { selectedCol: 'col1' }) as any);
    expect(result.title).toBeDefined();
    expect(result.body).toBeDefined();
  });

  it('builds reshape popup', () => {
    const result = buildBodyAndTitle(buildProps(PopupType.RESHAPE) as any);
    expect(result.title).toBeDefined();
    expect(result.body).toBeDefined();
  });

  it('builds about popup', () => {
    const result = buildBodyAndTitle(buildProps(PopupType.ABOUT) as any);
    expect(result.title).toBeDefined();
    expect(result.body).toBeDefined();
  });

  it('builds confirm popup', () => {
    const result = buildBodyAndTitle(buildProps(PopupType.CONFIRM, { title: 'Confirm Action' }) as any);
    expect(result.title).toBeDefined();
    expect(result.body).toBeDefined();
  });

  it('builds copy range popup', () => {
    const result = buildBodyAndTitle(buildProps(PopupType.COPY_RANGE, { title: 'Copy' }) as any);
    expect(result.title).toBeDefined();
    expect(result.body).toBeDefined();
  });

  it('builds range highlight popup', () => {
    const result = buildBodyAndTitle(buildProps(PopupType.RANGE) as any);
    expect(result.title).toBeDefined();
    expect(result.body).toBeDefined();
  });

  it('builds xarray dimensions popup', () => {
    const result = buildBodyAndTitle(buildProps(PopupType.XARRAY_DIMENSIONS) as any);
    expect(result.title).toBeDefined();
    expect(result.body).toBeDefined();
  });

  it('builds xarray indexes popup', () => {
    const result = buildBodyAndTitle(buildProps(PopupType.XARRAY_INDEXES) as any);
    expect(result.title).toBeDefined();
    expect(result.body).toBeDefined();
  });

  it('builds rename popup', () => {
    const result = buildBodyAndTitle(buildProps(PopupType.RENAME) as any);
    expect(result.title).toBeDefined();
    expect(result.body).toBeDefined();
  });

  it('builds replacement popup', () => {
    const result = buildBodyAndTitle(buildProps(PopupType.REPLACEMENT, { selectedCol: 'col1' }) as any);
    expect(result.title).toBeDefined();
    expect(result.body).toBeDefined();
  });

  it('builds error popup', () => {
    const result = buildBodyAndTitle(buildProps(PopupType.ERROR) as any);
    expect(result.title).toBeDefined();
    expect(result.body).toBeDefined();
  });

  it('builds export popup', () => {
    const result = buildBodyAndTitle(buildProps(PopupType.EXPORT) as any);
    expect(result.title).toBeDefined();
    expect(result.body).toBeDefined();
  });

  it('builds instances popup', () => {
    const result = buildBodyAndTitle(buildProps(PopupType.INSTANCES) as any);
    expect(result.title).toBeDefined();
    expect(result.body).toBeDefined();
  });

  it('builds variance popup', () => {
    const result = buildBodyAndTitle(buildProps(PopupType.VARIANCE, { selectedCol: 'col1' }) as any);
    expect(result.title).toBeDefined();
    expect(result.body).toBeDefined();
  });

  it('builds upload popup', () => {
    const result = buildBodyAndTitle(buildProps(PopupType.UPLOAD) as any);
    expect(result.title).toBeDefined();
    expect(result.body).toBeDefined();
  });

  it('builds arcticdb popup', () => {
    const result = buildBodyAndTitle(buildProps(PopupType.ARCTICDB) as any);
    expect(result.title).toBeDefined();
    expect(result.body).toBeDefined();
  });

  it('builds jump to column popup', () => {
    const result = buildBodyAndTitle(buildProps(PopupType.JUMP_TO_COLUMN) as any);
    expect(result.title).toBeDefined();
    expect(result.body).toBeDefined();
  });

  it('builds duplicates popup', () => {
    const result = buildBodyAndTitle(buildProps(PopupType.DUPLICATES) as any);
    expect(result.title).toBeDefined();
    expect(result.body).toBeDefined();
  });

  it('builds view row popup', () => {
    const result = buildBodyAndTitle(buildProps(PopupType.VIEW_ROW, { row: { [gu.IDX]: { view: '0' } } }) as any);
    expect(result.title).toBeDefined();
    expect(result.body).toBeDefined();
  });

  it('returns empty for hidden popup', () => {
    const result = buildBodyAndTitle(buildProps(PopupType.HIDDEN) as any);
    expect(result.title).toBeUndefined();
    expect(result.body).toBeUndefined();
  });
});
