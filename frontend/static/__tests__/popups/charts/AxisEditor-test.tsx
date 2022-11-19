import { act, fireEvent, render } from '@testing-library/react';
import * as React from 'react';

import * as menuUtils from '../../../menuUtils';
import { default as AxisEditor } from '../../../popups/charts/AxisEditor';

describe('ChartLabel tests', () => {
  let result: Element;
  const updateAxis = jest.fn();
  let openMenuSpy: jest.SpyInstance<
    (e: React.MouseEvent) => void,
    [
      open: (e: React.MouseEvent) => void,
      close: () => void,
      toggleRef?: React.RefObject<HTMLElement>,
      clickFilters?: (e: MouseEvent) => boolean,
    ]
  >;

  beforeEach(() => {
    openMenuSpy = jest.spyOn(menuUtils, 'openMenu');
    const props = {
      data: {
        min: { y: 1 },
        max: { y: 5 },
      },
      y: [{ value: 'y' }],
      updateAxis,
    };
    result = render(<AxisEditor {...props} />).container;
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('creates label', () => {
    expect(result.querySelector('span.axis-select')!.textContent).toBe('y (1,5)');
  });

  it('handles errors & changes', async () => {
    await act(async () => {
      await fireEvent.click(result.querySelector('span.axis-select')!);
    });
    const inputs = Array.from(result.querySelectorAll('input.axis-input'));
    await act(async () => {
      await fireEvent.change(inputs[0], { target: { value: '3' } });
    });
    await act(async () => {
      await fireEvent.change(inputs[inputs.length - 1], { target: { value: '4' } });
    });
    await act(async () => {
      openMenuSpy.mock.calls[openMenuSpy.mock.calls.length - 1][1]();
    });
    expect(updateAxis).toBeCalledWith({ min: { y: 3 }, max: { y: 4 } });
    await act(async () => {
      await fireEvent.change(inputs[inputs.length - 1], { target: { value: 'a' } });
    });
    updateAxis.mockReset();
    await act(async () => {
      openMenuSpy.mock.calls[openMenuSpy.mock.calls.length - 1][1]();
    });
    expect(updateAxis).not.toHaveBeenCalled();
  });
});
