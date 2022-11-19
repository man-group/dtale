import { act, fireEvent, screen } from '@testing-library/react';

import { CreateColumnType } from '../../../popups/create/CreateColumnState';
import { validateExponentialSmoothingCfg } from '../../../popups/create/CreateExponentialSmoothing';
import { selectOption, mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateExponentialSmoothing', () => {
  const spies = new TestSupport.Spies();
  let result: Element;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    await spies.clickBuilder('Exponential Smoothing');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('DataViewer: build exponential smoothing column', async () => {
    expect(screen.getByText('Exponential Smoothing')).toHaveClass('active');
    await selectOption(result.getElementsByClassName('Select')[0] as HTMLElement, 'col1');
    await act(async () => {
      await fireEvent.change(screen.getByTestId('alpha-raw-input'), { target: { value: '0.3' } });
    });
    await spies.validateCfg({
      cfg: {
        col: 'col1',
        alpha: 0.3,
      },
      name: 'col1_exp_smooth',
      type: CreateColumnType.EXPONENTIAL_SMOOTHING,
    });
  });

  it('validates configuration', () => {
    expect(validateExponentialSmoothingCfg(t, { alpha: 0.0 })).toBe('Please select a column to smooth!');
    expect(
      validateExponentialSmoothingCfg(t, {
        col: 'col1',
        alpha: 0.0,
      }),
    ).toBe('Please enter a valid float for alpha!');
    expect(
      validateExponentialSmoothingCfg(t, {
        col: 'col1',
        alpha: 0.3,
      }),
    ).toBeUndefined();
  });
});
