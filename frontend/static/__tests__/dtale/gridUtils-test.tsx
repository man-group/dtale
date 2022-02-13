import * as gu from '../../dtale/gridUtils';
import * as measureText from '../../dtale/MeasureText';
import { mockColumnDef } from '../mocks/MockColumnDef';

describe('gridUtils tests', () => {
  it('gridUtils: testing buildDataProps', () => {
    let dataProps = gu.buildDataProps(mockColumnDef({ name: 'foo', dtype: 'foo' }), 'bar', undefined);
    expect({ raw: 'bar', view: 'bar', style: {} }).toEqual(dataProps);
    dataProps = gu.buildDataProps(mockColumnDef({ name: 'foo', dtype: 'foo' }), undefined, undefined);
    expect(dataProps.view).toBe('');
  });

  it('gridUtils: calcColWidth resized', () => {
    expect(gu.calcColWidth(mockColumnDef({ resized: true, width: 100 }), {}, 1)).toEqual({
      width: 100,
    });
  });

  describe('maxColumnWidth', () => {
    let measureTextSpy: jest.SpyInstance;

    beforeEach(() => {
      measureTextSpy = jest.spyOn(measureText, 'measureText');
    });

    afterEach(jest.resetAllMocks);

    afterAll(jest.restoreAllMocks);

    it('column truncated', () => {
      measureTextSpy.mockImplementation(() => 150);
      expect(gu.calcColWidth(mockColumnDef(), {}, 1, undefined, undefined, 100)).toEqual({
        width: 100,
        dataWidth: 70,
        headerWidth: 150,
        resized: true,
      });
    });

    it('column unaffected', () => {
      measureTextSpy.mockImplementation(() => 50);
      expect(gu.calcColWidth(mockColumnDef(), {}, 1, undefined, undefined, 100)).toEqual({
        width: 70,
        dataWidth: 70,
        headerWidth: 50,
      });
    });
  });

  describe('verticalHeaders', () => {
    const columns = [
      mockColumnDef({ index: 0, visible: true }),
      mockColumnDef({ index: 1, width: 100, headerWidth: 100, dataWidth: 75, visible: true }),
    ];
    it('getColWidth', () => {
      const width = gu.getColWidth(1, columns, undefined, true);
      expect(width).toEqual(75);
    });

    it('getRowHeight', () => {
      let height = gu.getRowHeight(0, columns, undefined, undefined, true);
      expect(height).toEqual(100);
      height = gu.getRowHeight(0, columns, undefined, undefined, false);
      expect(height).toEqual(gu.HEADER_HEIGHT);
    });
  });
});
