import { act, fireEvent, screen } from '@testing-library/react';

import * as customHooks from '../../../customHooks';
import { validateBinsCfg } from '../../../popups/create/CreateBins';
import { BinsOperation, CreateColumnType } from '../../../popups/create/CreateColumnState';
import { mockChartJS, selectOption, mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateBins', () => {
  const spies = new TestSupport.Spies();
  let result: Element;

  beforeAll(() => mockChartJS());

  beforeEach(async () => {
    spies.setupMockImplementations();
    const useDebounceSpy = jest.spyOn(customHooks, 'useDebounce');
    useDebounceSpy.mockImplementation((value) => value);
    result = await spies.setupWrapper();
    await spies.clickBuilder('Bins');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  const binInputs = (): HTMLElement => screen.getByTestId('bins-inputs');

  it('builds bins cut column', async () => {
    expect(binInputs).toBeDefined();
    await selectOption(result.getElementsByClassName('Select')[0] as HTMLElement, 'col2');
    await act(async () => {
      await fireEvent.click(screen.getByText('Cut (Evenly Spaced)'));
    });
    await act(async () => {
      await fireEvent.change(binInputs().querySelectorAll('div.form-group')[2].getElementsByTagName('input')[0], {
        target: { value: '4' },
      });
    });
    await act(async () => {
      await fireEvent.change(binInputs().querySelectorAll('div.form-group')[3].getElementsByTagName('input')[0], {
        target: { value: 'foo,bar,bin,baz' },
      });
    });

    expect(screen.getByTestId('column-analysis-chart')).toBeDefined();

    await spies.validateCfg({
      cfg: {
        col: 'col2',
        bins: '4',
        labels: 'foo,bar,bin,baz',
        operation: BinsOperation.CUT,
      },
      name: 'col2_bins',
      type: CreateColumnType.BINS,
    });

    const cfg = { col: null } as any;
    expect(validateBinsCfg(t, cfg)).toBe('Missing a column selection!');
    cfg.col = 'x';
    cfg.bins = '';
    expect(validateBinsCfg(t, cfg)).toBe('Missing a bins selection!');
    cfg.bins = '4';
    cfg.labels = 'foo';
    expect(validateBinsCfg(t, cfg)).toBe('There are 4 bins, but you have only specified 1 labels!');
  });

  it('builds bins qcut column', async () => {
    await act(async () => {
      await fireEvent.change(result.querySelector('div.form-group')!.getElementsByTagName('input')[0], {
        target: { value: 'qcut_col' },
      });
    });
    await selectOption(result.getElementsByClassName('Select')[0] as HTMLElement, 'col2');
    await act(async () => {
      await fireEvent.click(screen.getByText('Qcut (Evenly Sized)'));
    });
    await act(async () => {
      await fireEvent.change(binInputs().querySelectorAll('div.form-group')[2].getElementsByTagName('input')[0], {
        target: { value: '4' },
      });
    });

    await spies.validateCfg({
      cfg: {
        col: 'col2',
        bins: '4',
        labels: '',
        operation: BinsOperation.QCUT,
      },
      name: 'qcut_col',
      type: CreateColumnType.BINS,
    });
  });
});
