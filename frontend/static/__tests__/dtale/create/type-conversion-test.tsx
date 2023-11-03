import { act, fireEvent, screen } from '@testing-library/react';
import axios from 'axios';

import { CreateColumnType, SaveAs, TypeConversionUnit } from '../../../popups/create/CreateColumnState';
import { validateTypeConversionCfg } from '../../../popups/create/CreateTypeConversion';
import { mockColumnDef } from '../../mocks/MockColumnDef';
import reduxUtils from '../../redux-test-utils';
import { selectOption, mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateTypeConversion', () => {
  const spies = new TestSupport.Spies();
  let result: Element;

  beforeEach(async () => {
    spies.setupMockImplementations();
    (axios.get as any).mockImplementation((url: string) => {
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
    await spies.clickBuilder('Type Conversion');
    await act(async () => {
      await fireEvent.change(result.getElementsByTagName('input')[0], { target: { value: 'conv_col' } });
    });
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  const colSelect = (): HTMLElement =>
    screen.getByText('Column To Convert').parentElement!.getElementsByClassName('Select')[0] as HTMLElement;
  const formatSelect = (): HTMLElement =>
    screen.getByText('Unit/Format').parentElement!.getElementsByClassName('Select')[0] as HTMLElement;

  it('build an int conversion column', async () => {
    expect(screen.getByText('Type Conversion')).toHaveClass('active');
    await selectOption(colSelect(), 'col1');
    await act(async () => {
      await fireEvent.click(screen.getByText('Str'));
    });
    await act(async () => {
      await fireEvent.click(screen.getByText('Date'));
    });
    await selectOption(formatSelect(), 'YYYYMMDD');
    await spies.validateCfg({
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
    await selectOption(colSelect(), 'col2');
    await act(async () => {
      await fireEvent.click(screen.getByText('Hex'));
    });
    await act(async () => {
      await fireEvent.click(screen.getByText('Int'));
    });
    await spies.validateCfg({
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
    await selectOption(colSelect(), 'col3');
    await act(async () => {
      await fireEvent.click(screen.getByText('Date'));
    });
    await act(async () => {
      await fireEvent.change(screen.getByText('Date Format').parentElement!.getElementsByTagName('input')[0], {
        target: { value: '%d/%m/%Y' },
      });
    });
    await spies.validateCfg({
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
      await fireEvent.click(result.querySelector('div.form-group')!.getElementsByTagName('button')[0]);
    });
    await selectOption(colSelect(), 'col5');
    await act(async () => {
      await fireEvent.click(screen.getByText('Date'));
    });
    await act(async () => {
      await fireEvent.click(result.getElementsByClassName('ico-check-box-outline-blank')[0]);
    });
    await spies.validateCfg({
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
    await selectOption(colSelect(), 'col4');
    await act(async () => {
      await fireEvent.click(screen.getByText('Int'));
    });
    await selectOption(formatSelect(), 'ms');
    await spies.validateCfg({
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
