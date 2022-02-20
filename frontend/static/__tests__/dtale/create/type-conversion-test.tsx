import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { ActionMeta, default as Select } from 'react-select';

import {
  BaseCreateComponentProps,
  CreateColumnType,
  SaveAs,
  TypeConversionUnit,
} from '../../../popups/create/CreateColumnState';
import {
  default as CreateTypeConversion,
  validateTypeConversionCfg,
} from '../../../popups/create/CreateTypeConversion';
import { mockColumnDef } from '../../mocks/MockColumnDef';
import reduxUtils from '../../redux-test-utils';
import { mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateTypeConversion', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeEach(async () => {
    spies.setupMockImplementations();
    spies.axiosGetSpy.mockImplementation((url: string) => {
      if (url.startsWith('/dtale/dtypes')) {
        return Promise.resolve({
          data: {
            dtypes: [
              ...reduxUtils.DTYPES.dtypes,
              mockColumnDef({
                name: 'col5',
                index: 4,
                dtype: 'mixed-integer',
              }),
            ],
            success: true,
          },
        });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    result = await spies.setupWrapper();
    result = await spies.clickBuilder(result, 'Type Conversion');
    await act(async () => {
      result
        .find('div.form-group')
        .first()
        .find('input')
        .first()
        .simulate('change', { target: { value: 'conv_col' } });
    });
    result = result.update();
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  const findTypeConversion = (): ReactWrapper<BaseCreateComponentProps, Record<string, any>> =>
    result.find(CreateTypeConversion);

  it('build an int conversion column', async () => {
    expect(findTypeConversion()).toHaveLength(1);
    await act(async () => {
      findTypeConversion()
        .find(Select)
        .first()
        .props()
        .onChange?.({ value: 'col1' }, {} as ActionMeta<unknown>);
    });
    result = result.update();
    await act(async () => {
      findTypeConversion().find('div.form-group').at(1).find('button').last().simulate('click');
    });
    result = result.update();
    await act(async () => {
      findTypeConversion().find('div.form-group').at(1).find('button').first().simulate('click');
    });
    result = result.update();
    await act(async () => {
      findTypeConversion()
        .find(Select)
        .at(1)
        .props()
        .onChange?.({ value: 'YYYYMMDD' }, {} as ActionMeta<unknown>);
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: {
        to: 'date',
        from: 'int64',
        col: 'col1',
        unit: TypeConversionUnit.DATE,
        applyAllType: false,
      },
      name: 'conv_col',
      type: CreateColumnType.TYPE_CONVERSION,
    });
  });

  it('builds a float conversion column', async () => {
    await act(async () => {
      findTypeConversion()
        .find(Select)
        .first()
        .props()
        .onChange?.({ value: 'col2' }, {} as ActionMeta<unknown>);
    });
    result = result.update();
    await act(async () => {
      findTypeConversion().find('div.form-group').at(1).find('button').last().simulate('click');
    });
    result = result.update();
    await act(async () => {
      findTypeConversion().find('div.form-group').at(1).find('button').first().simulate('click');
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: {
        col: 'col2',
        to: 'int',
        from: 'float64',
        applyAllType: false,
      },
      name: 'conv_col',
      type: CreateColumnType.TYPE_CONVERSION,
    });
  });

  it('builds a string conversion column', async () => {
    await act(async () => {
      findTypeConversion()
        .find(Select)
        .first()
        .props()
        .onChange?.({ value: 'col3' }, {} as ActionMeta<unknown>);
    });
    result = result.update();
    await act(async () => {
      findTypeConversion().find('div.form-group').at(1).find('button').first().simulate('click');
    });
    result = result.update();
    await act(async () => {
      findTypeConversion()
        .find('div.form-group')
        .at(2)
        .find('input')
        .first()
        .simulate('change', { target: { value: '%d/%m/%Y' } });
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: {
        col: 'col3',
        to: 'date',
        from: 'object',
        fmt: '%d/%m/%Y',
        applyAllType: false,
      },
      name: 'conv_col',
      type: CreateColumnType.TYPE_CONVERSION,
    });
  });

  it('builda a mixed conversion column', async () => {
    await act(async () => {
      result.find('div.form-group').first().find('button').first().simulate('click');
    });
    result = result.update();
    await act(async () => {
      findTypeConversion()
        .find(Select)
        .first()
        .props()
        .onChange?.({ value: 'col5' }, {} as ActionMeta<unknown>);
    });
    result = result.update();
    await act(async () => {
      findTypeConversion().find('div.form-group').at(1).find('button').first().simulate('click');
    });
    result = result.update();
    await act(async () => {
      findTypeConversion().find('i.ico-check-box-outline-blank').simulate('click');
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: {
        col: 'col5',
        to: 'date',
        from: 'mixed-integer',
        fmt: undefined,
        unit: undefined,
        applyAllType: true,
      },
      name: undefined,
      saveAs: SaveAs.INPLACE,
      type: CreateColumnType.TYPE_CONVERSION,
    });
  });

  it('builds a date conversion column', async () => {
    await act(async () => {
      findTypeConversion()
        .find(Select)
        .first()
        .props()
        .onChange?.({ value: 'col4' }, {} as ActionMeta<unknown>);
    });
    result = result.update();
    await act(async () => {
      findTypeConversion().find('div.form-group').at(1).find('button').first().simulate('click');
    });
    result = result.update();
    await act(async () => {
      findTypeConversion()
        .find(Select)
        .at(1)
        .props()
        .onChange?.({ value: 'ms' }, {} as ActionMeta<unknown>);
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: {
        col: 'col4',
        to: 'int',
        from: 'datetime64[ns]',
        unit: TypeConversionUnit.MILLISECOND,
        applyAllType: false,
      },
      name: 'conv_col',
      type: CreateColumnType.TYPE_CONVERSION,
    });
  });

  it('validates configuration', () => {
    expect(validateTypeConversionCfg(t, { applyAllType: false })).toBe('Missing a column selection!');
    expect(validateTypeConversionCfg(t, { col: 'col1', applyAllType: false })).toBe('Missing a conversion selection!');
    expect(
      validateTypeConversionCfg(t, {
        col: 'col2',
        to: 'date',
        from: 'int64',
        applyAllType: false,
      }),
    ).toBe('Missing a unit selection!');
    expect(
      validateTypeConversionCfg(t, {
        col: 'col2',
        to: 'int',
        from: 'datetime64[ns]',
        unit: TypeConversionUnit.DAY,
        applyAllType: false,
      }),
    ).toBe("Invalid unit selection, valid options are 'YYYYMMDD' or 'ms'");
    expect(
      validateTypeConversionCfg(t, {
        col: 'col2',
        to: 'int',
        from: 'datetime64[ns]',
        unit: TypeConversionUnit.MILLISECOND,
        applyAllType: false,
      }),
    ).toBeUndefined();
  });
});
