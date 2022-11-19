import { act, fireEvent, screen } from '@testing-library/react';
import axios from 'axios';

import { DataViewerData } from '../../../dtale/DataViewerState';
import { clickColMenuButton } from '../../iframe/iframe-utils';
import reduxUtils from '../../redux-test-utils';
import { selectOption } from '../../test-utils';

import * as TestSupport from './Formatting.test.support';

describe('NumericFormatting', () => {
  const spies = new TestSupport.Spies();
  const { open } = window;
  const openFn = jest.fn();

  beforeAll(() => {
    spies.beforeAll();
    delete (window as any).open;
    window.open = openFn;
  });

  beforeEach(async () => {
    spies.setupMockImplementations();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    spies.afterAll();
    window.open = open;
  });

  const validateFormatting = async (expected: string, i: number): Promise<void> => {
    const clickers = [...spies.body().getElementsByClassName('form-group')[i].getElementsByTagName('button')];
    await act(async () => {
      await fireEvent.click(clickers[i === 0 ? clickers.length - 1 : 0]);
    });
    expect(spies.body().getElementsByTagName('small')[0].textContent).toBe(expected);
  };

  const toggleFormatting = async (toggleIdx: number): Promise<void> => {
    const buttons = [...spies.body().getElementsByClassName('form-group')[toggleIdx].getElementsByTagName('button')];
    await act(async () => {
      await fireEvent.click(buttons[buttons.length - 1]);
    });
  };

  it('applies formatting', async () => {
    await spies.setupWrapper(1);
    expect(document.getElementsByClassName('modal-title')[0].textContent).toBe('Formatting');
    await act(async () => {
      await fireEvent.click(document.getElementsByClassName('modal-header')[0].getElementsByClassName('ico-close')[0]);
    });
    expect(spies.body()).toBeUndefined();
    await act(async () => {
      await fireEvent.click(screen.queryAllByTestId('header-cell')[1].getElementsByClassName('text-nowrap')[0]);
    });
    await clickColMenuButton('Formats');
    await act(async () => {
      await fireEvent.click(spies.body().getElementsByClassName('ico-info-outline')[0]);
    });
    expect(openFn.mock.calls[openFn.mock.calls.length - 1][0]).toBe('http://numeraljs.com/#format');
    await validateFormatting('EX: -123456.789 => -123456.789000', 0);
    await validateFormatting('EX: -123456.789 => -123,456.789000', 1);
    await validateFormatting('EX: -123456.789 => -123.456789k', 2);
    await validateFormatting('EX: -123456.789 => -1.234568e+5', 3);
    await validateFormatting('EX: -123456.789 => 1.23456789b-BPS', 4);
    await act(async () => {
      await fireEvent.click(spies.body().querySelectorAll('div.form-group')[5].getElementsByTagName('button')[0]);
    });
    expect(spies.body().getElementsByTagName('small')[0].getElementsByTagName('span')[0]).toHaveStyle({ color: 'red' });
    await toggleFormatting(1);
    await toggleFormatting(2);
    await toggleFormatting(3);
    await toggleFormatting(4);
    await toggleFormatting(5);
    await selectOption(spies.body().getElementsByClassName('Select')[1] as HTMLElement, '-');
    await spies.validateCfg('1', 'col2', { fmt: '0.000000', style: { redNegs: false } }, false, '-');
    expect(spies.cell('2|1').textContent).toBe('2.500000');
    expect(spies.store?.getState().settings.nanDisplay).toBe('-');
  });

  it('applies formatting to all columns of a similar data type', async () => {
    (axios.get as any).mockImplementation((url: string) => {
      if (url.startsWith('/dtale/data')) {
        return Promise.resolve({
          data: {
            ...reduxUtils.DATA,
            results: reduxUtils.DATA.results.map((r: DataViewerData) => ({ ...r, col5: (r as any).col1 })),
            columns: [...reduxUtils.DATA.columns, { ...reduxUtils.DTYPES.dtypes[0], name: 'col5' }],
          },
        });
      } else if (url.startsWith('/dtale/dtypes')) {
        return Promise.resolve({
          data: {
            ...reduxUtils.DTYPES,
            dtypes: [...reduxUtils.DTYPES.dtypes, { ...reduxUtils.DTYPES.dtypes[0], name: 'col5' }],
          },
        });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    await spies.setupWrapper(0);
    await act(async () => {
      const buttons = [...spies.body().querySelectorAll('div.form-group')[0].getElementsByTagName('button')];
      await fireEvent.click(buttons[buttons.length - 1]);
    });
    await act(async () => {
      await fireEvent.click(spies.body().getElementsByClassName('ico-check-box-outline-blank')[0]);
    });
    await spies.validateCfg('1', 'col1', { fmt: '0.000000', style: { redNegs: false } }, true, 'nan');
    expect(spies.cell('1|1').textContent).toBe('1.000000');
    expect(spies.cell('5|1').textContent).toBe('1.000000');
  });
});
