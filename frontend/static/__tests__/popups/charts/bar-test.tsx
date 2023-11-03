import { act, fireEvent, screen } from '@testing-library/react';

import { getLastChart, selectOption } from '../../test-utils';

import * as TestSupport from './charts.test.support';

describe('Charts bar tests', () => {
  const spies = new TestSupport.Spies();
  let result: Element;

  beforeAll(() => spies.beforeAll());

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupCharts();
  });

  afterAll(() => spies.afterAll());

  const axisEditor = (): Element => result.querySelector('.toolbar__axis')!;

  it('Charts: rendering', async () => {
    await selectOption(screen.getByText('X').parentElement!.getElementsByClassName('Select')[0] as HTMLElement, 'col4');
    await selectOption(screen.getByText('Y').parentElement!.getElementsByClassName('Select')[0] as HTMLElement, 'col1');
    await spies.updateChartType('bar');
    await act(async () => {
      await fireEvent.click(result.getElementsByTagName('button')[0]);
    });
    let lastChart = getLastChart(spies.createChartSpy);
    expect(lastChart.type).toBe('bar');
    await selectOption(screen.getByText('X').parentElement!.getElementsByClassName('Select')[0] as HTMLElement, 'col1');
    const axisEditorLink = axisEditor().querySelector('span.axis-select')!;
    await act(async () => {
      await fireEvent.click(axisEditorLink);
    });
    await act(async () => {
      await fireEvent.change(screen.getByTestId('col1-min'), { target: { value: '40' } });
    });
    await act(async () => {
      await fireEvent.change(screen.getByTestId('col1-max'), { target: { value: '42' } });
    });
    await spies.callLastCloseMenu();
    lastChart = getLastChart(spies.createChartSpy);
    expect(lastChart.options?.scales?.['y-col1']?.ticks).toEqual({
      min: 40,
      max: 42,
    });
    await act(async () => {
      await fireEvent.click(axisEditorLink);
    });
    await act(async () => {
      await fireEvent.change(screen.getByTestId('col1-min'), { target: { value: '40' } });
    });
    await act(async () => {
      await fireEvent.change(screen.getByTestId('col1-max'), { target: { value: 'a' } });
    });
    await spies.callLastCloseMenu();
    lastChart = getLastChart(spies.createChartSpy);
    expect(lastChart.options?.scales?.['y-col1']?.ticks).toEqual({
      min: 40,
      max: 42,
    });
    await act(async () => {
      await fireEvent.click(axisEditorLink);
    });
    await act(async () => {
      await fireEvent.change(screen.getByTestId('col1-max'), { target: { value: '39' } });
    });
    await spies.callLastCloseMenu();
    lastChart = getLastChart(spies.createChartSpy);
    expect(lastChart.options?.scales?.['y-col1']?.ticks).toEqual({
      min: 40,
      max: 42,
    });
  });
});
