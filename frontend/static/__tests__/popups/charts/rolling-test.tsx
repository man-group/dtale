import { act, fireEvent, screen } from '@testing-library/react';

import { selectOption } from '../..//test-utils';

import * as TestSupport from './charts.test.support';

describe('Charts rolling tests', () => {
  const spies = new TestSupport.Spies();

  beforeAll(() => spies.beforeAll());

  beforeEach(async () => {
    spies.setupMockImplementations();
    await spies.setupCharts();
  });

  afterAll(() => spies.afterAll());

  it('Charts: rendering window error', async () => {
    await selectOption(screen.getByText('X').parentElement!.getElementsByClassName('Select')[0] as HTMLElement, 'col4');
    await selectOption(screen.getByText('Y').parentElement!.getElementsByClassName('Select')[0] as HTMLElement, 'col1');
    await selectOption(
      screen.getByText('Group').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'col2',
    );
    await selectOption(
      screen.getByText('Aggregation').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'Rolling',
    );
    await act(async () => {
      await fireEvent.change(screen.getByText('Window').parentElement!.getElementsByTagName('input')[0], {
        target: { value: '' },
      });
    });
    await selectOption(
      screen.getByText('Computation').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'Correlation',
    );
    await act(async () => {
      await fireEvent.click(screen.getByText('Load'));
    });
    expect(screen.getByRole('alert').textContent).toBe('Aggregation (rolling) requires a window');
  });

  it('Charts: rendering computation error', async () => {
    await selectOption(screen.getByText('X').parentElement!.getElementsByClassName('Select')[0] as HTMLElement, 'col4');
    await selectOption(screen.getByText('Y').parentElement!.getElementsByClassName('Select')[0] as HTMLElement, 'col1');
    await selectOption(
      screen.getByText('Group').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'col2',
    );
    await selectOption(
      screen.getByText('Aggregation').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'Rolling',
    );
    await act(async () => {
      await fireEvent.change(screen.getByText('Window').parentElement!.getElementsByTagName('input')[0], {
        target: { value: '10' },
      });
    });
    await act(async () => {
      await fireEvent.click(screen.getByText('Load'));
    });
    expect(screen.getByRole('alert').textContent).toBe('Aggregation (rolling) requires a computation');
  });
});
