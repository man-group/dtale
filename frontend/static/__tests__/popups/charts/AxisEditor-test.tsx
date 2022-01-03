import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';

import * as menuUtils from '../../../menuUtils';
import { default as AxisEditor, AxisEditorProps } from '../../../popups/charts/AxisEditor';

describe('ChartLabel tests', () => {
  let result: ReactWrapper<AxisEditorProps>;
  const updateAxis = jest.fn();
  let openMenuSpy: jest.SpyInstance<
    (e: React.MouseEvent) => void,
    [
      open: (e: React.MouseEvent) => void,
      close: () => void,
      toggleRef?: React.RefObject<HTMLElement>,
      clickFilters?: () => boolean,
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
    result = mount(<AxisEditor {...props} />);
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('creates label', () => {
    expect(result.find('span.axis-select').text()).toBe('y (1,5)');
  });

  it('handles errors & changes', async () => {
    await act(async () => {
      result.find('span.axis-select').simulate('click');
    });
    result = result.update();
    await act(async () => {
      result
        .find('input.axis-input')
        .first()
        .simulate('change', { target: { value: '3' } });
    });
    result = result.update();
    await act(async () => {
      result
        .find('input.axis-input')
        .last()
        .simulate('change', { target: { value: '4' } });
    });
    result = result.update();
    await act(async () => {
      openMenuSpy.mock.calls[openMenuSpy.mock.calls.length - 1][1]();
    });
    result = result.update();
    expect(updateAxis).toBeCalledWith({ min: { y: 3 }, max: { y: 4 } });
    await act(async () => {
      result
        .find('input.axis-input')
        .last()
        .simulate('change', { target: { value: 'a' } });
    });
    result = result.update();
    updateAxis.mockReset();
    await act(async () => {
      openMenuSpy.mock.calls[openMenuSpy.mock.calls.length - 1][1]();
    });
    expect(updateAxis).not.toHaveBeenCalled();
  });
});
