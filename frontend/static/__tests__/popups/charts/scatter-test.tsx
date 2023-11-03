import { act, fireEvent, screen } from '@testing-library/react';

import { getLastChart, selectOption } from '../../test-utils';

import * as TestSupport from './charts.test.support';

describe('Charts scatter tests', () => {
  const spies = new TestSupport.Spies();

  beforeAll(() => spies.beforeAll());

  beforeEach(async () => {
    spies.setupMockImplementations();
    await spies.setupCharts();
  });

  afterAll(() => spies.afterAll());

  it('Charts: rendering', async () => {
    await selectOption(screen.getByText('X').parentElement!.getElementsByClassName('Select')[0] as HTMLElement, 'col4');
    await selectOption(screen.getByText('Y').parentElement!.getElementsByClassName('Select')[0] as HTMLElement, 'col1');
    await spies.updateChartType('scatter');
    await act(async () => {
      await fireEvent.click(screen.getByText('Load'));
    });
    expect(getLastChart(spies.createChartSpy).type).toBe('scatter');
    await spies.updateChartType('bar');
    await act(async () => {
      await fireEvent.click(screen.getByText('Load'));
    });
    expect(getLastChart(spies.createChartSpy).type).toBe('bar');
  });
});
