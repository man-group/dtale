import { buildCode as buildBinsCode } from '../../../popups/create/CreateBins';
import {
  BinsOperation,
  DatetimeConversionType,
  DatetimeOperation,
  DatetimePropertyType,
  NumericOperationType,
  OperandDataType,
  TypeConversionUnit,
} from '../../../popups/create/CreateColumnState';
import { buildCode as buildDatetimeCode } from '../../../popups/create/CreateDatetime';
import { buildCode as buildNumericCode } from '../../../popups/create/CreateNumeric';
import { buildCode as buildStringCode } from '../../../popups/create/CreateString';
import { buildCode as buildTypeConversionCode } from '../../../popups/create/typeConversionCodeUtils';

describe('CreateColumn buildCode tests', () => {
  it('String buildCode tests', () => {
    const code = buildStringCode({ cols: [], joinChar: '-' });
    expect(code).toBeUndefined();
  });

  it('Numeric buildCode test', () => {
    let code = buildNumericCode({
      left: { type: OperandDataType.COL, col: 'col1' },
      operation: NumericOperationType.SUM,
      right: { type: OperandDataType.COL, col: 'col2' },
    });
    expect(code).toBe("df['col1'] + df['col2']");
    code = buildNumericCode({
      left: { type: OperandDataType.COL },
      operation: NumericOperationType.SUM,
      right: { type: OperandDataType.COL, col: 'col2' },
    });
    expect(code).toBeUndefined();
    code = buildNumericCode({
      left: { type: OperandDataType.COL, col: 'col1' },
      operation: NumericOperationType.SUM,
      right: { type: OperandDataType.COL },
    });
    expect(code).toBeUndefined();
    code = buildNumericCode({
      left: { type: OperandDataType.VAL, val: '5' },
      operation: NumericOperationType.SUM,
      right: { type: OperandDataType.VAL, val: '6' },
    });
    expect(code).toBe('5 + 6');
    code = buildNumericCode({
      left: { type: OperandDataType.VAL },
      operation: NumericOperationType.SUM,
      right: { type: OperandDataType.VAL, val: '6' },
    });
    expect(code).toBeUndefined();
    code = buildNumericCode({
      left: { type: OperandDataType.VAL, val: '5' },
      operation: NumericOperationType.SUM,
      right: { type: OperandDataType.VAL },
    });
    expect(code).toBeUndefined();
  });

  it('Datetime buildCode test', () => {
    let code = buildDatetimeCode({ operation: DatetimeOperation.CONVERSION });
    expect(code).toBeUndefined();
    code = buildDatetimeCode({
      col: 'col1',
      operation: DatetimeOperation.CONVERSION,
    });
    expect(code).toBeUndefined();
    code = buildDatetimeCode({
      col: 'col1',
      operation: DatetimeOperation.CONVERSION,
      conversion: DatetimeConversionType.MONTH_END,
    });
    expect(code).toBe("df['col1'].dt.to_period('M').dt.to_timestamp(how='end')");
    code = buildDatetimeCode({
      col: 'col1',
      operation: DatetimeOperation.PROPERTY,
      conversion: DatetimeConversionType.MONTH_END,
    });
    expect(code).toBeUndefined();
    code = buildDatetimeCode({
      col: 'col1',
      operation: DatetimeOperation.PROPERTY,
      property: DatetimePropertyType.HOUR,
      conversion: DatetimeConversionType.MONTH_END,
    });
    expect(code).toBe("df['col1'].dt.hour");
    code = buildDatetimeCode({
      col: 'col1',
      operation: DatetimeOperation.PROPERTY,
      property: DatetimePropertyType.WEEKDAY_NAME,
      conversion: DatetimeConversionType.MONTH_END,
    });
    expect(code).toBe("df['col1'].dt.day_name()");
  });

  it('Bins buildCode test', () => {
    let code = buildBinsCode({ operation: BinsOperation.CUT, bins: '', labels: '' });
    expect(code).toBeUndefined();
    code = buildBinsCode({
      col: { value: 'col1' },
      operation: BinsOperation.CUT,
      bins: '',
      labels: '',
    });
    expect(code).toBeUndefined();
    code = buildBinsCode({
      col: { value: 'col1' },
      operation: BinsOperation.CUT,
      bins: '3',
      labels: '',
    });
    expect(code).toBe("pd.cut(df['col1'], bins=3)");
    code = buildBinsCode({
      col: { value: 'col1' },
      operation: BinsOperation.QCUT,
      bins: '3',
      labels: '',
    });
    expect(code).toBe("pd.qcut(df['col1'], q=3)");
    code = buildBinsCode({
      col: { value: 'col1' },
      operation: BinsOperation.CUT,
      bins: '3',
      labels: 'foo,bar',
    });
    expect(code).toBeUndefined();
    code = buildBinsCode({
      col: { value: 'col1' },
      operation: BinsOperation.CUT,
      bins: '3',
      labels: 'foo,bar,baz',
    });
    expect(code).toBe("pd.cut(df['col1'], bins=3, labels=['foo', 'bar', 'baz'])");
  });

  it('TypeConversion buildCode test', () => {
    const code = buildTypeConversionCode({ applyAllType: false });
    expect(code).toBeUndefined();
    buildTypeConversionCode({
      col: 'col1',
      from: 'object',
      to: 'date',
      applyAllType: false,
    });
    buildTypeConversionCode({
      col: 'col1',
      from: 'object',
      to: 'int',
      applyAllType: false,
    });
    buildTypeConversionCode({
      col: 'col1',
      from: 'object',
      to: 'float',
      applyAllType: false,
    });
    buildTypeConversionCode({
      col: 'col1',
      from: 'int',
      to: 'date',
      unit: TypeConversionUnit.DATE,
      applyAllType: false,
    });
    buildTypeConversionCode({
      col: 'col1',
      from: 'int',
      to: 'date',
      applyAllType: false,
    });
    buildTypeConversionCode({
      col: 'col1',
      from: 'int',
      to: 'float',
      applyAllType: false,
    });
    buildTypeConversionCode({
      col: 'col1',
      from: 'date',
      to: 'int',
      unit: TypeConversionUnit.DATE,
      applyAllType: false,
    });
    buildTypeConversionCode({
      col: 'col1',
      from: 'date',
      to: 'int',
      applyAllType: false,
    });
    buildTypeConversionCode({
      col: 'col1',
      from: 'date',
      to: 'int',
      fmt: '%m/%d/%Y',
      applyAllType: false,
    });
    buildTypeConversionCode({
      col: 'col1',
      from: 'float64',
      to: 'int',
      applyAllType: false,
    });
    buildTypeConversionCode({
      col: 'col1',
      from: 'bool',
      to: 'int',
      applyAllType: false,
    });
  });
});
