import { act, fireEvent, screen } from '@testing-library/react';

import { CreateColumnType, RollingClosedType, RollingWindowType } from '../../../popups/create/CreateColumnState';
import { validateRollingCfg } from '../../../popups/create/CreateRolling';
import { selectOption, mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateRolling', () => {
  const spies = new TestSupport.Spies();
  let result: Element;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    await spies.clickBuilder('Rolling');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('DataViewer: build rolling column', async () => {
    expect(screen.getByText('Rolling')).toHaveClass('active');
    await selectOption(
      screen.getByText('Column*').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'col1',
    );
    await selectOption(
      screen.getByText('Computation').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'Mean',
    );
    await act(async () => {
      await fireEvent.change(screen.getByText('Min Periods').parentElement!.getElementsByTagName('input')[1], {
        target: { value: '1' },
      });
    });
    await act(async () => {
      await fireEvent.click(result.getElementsByClassName('ico-check-box-outline-blank')[0]);
    });
    await selectOption(
      screen.getByText('On').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'col2',
    );
    await selectOption(
      screen.getByText('Window Type').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'Triangular',
    );
    await act(async () => {
      await fireEvent.click(screen.getByText('Neither'));
    });
    await spies.validateCfg({
      cfg: {
        col: 'col1',
        center: true,
        closed: RollingClosedType.NEITHER,
        comp: 'mean',
        min_periods: '1',
        on: 'col2',
        win_type: RollingWindowType.TRIANG,
        window: '5',
      },
      name: 'col1_rolling_mean',
      type: CreateColumnType.ROLLING,
    });
  });

  it('DataViewer: build rolling cfg validation', () => {
    expect(validateRollingCfg(t, { window: '5', center: false })).toBe('Please select a column!');
    expect(validateRollingCfg(t, { col: 'col1', window: '5', center: false })).toBe('Please select a computation!');
    expect(
      validateRollingCfg(t, {
        col: 'col1',
        comp: 'mean',
        window: '5',
        center: false,
      }),
    ).toBeUndefined();
  });
});
