import { act, render, RenderResult } from '@testing-library/react';
import * as React from 'react';

import { NetworkUrlParams, NetworkUrlParamsProps } from '../../network/NetworkUrlParams';
import * as actions from '../../redux/actions/dtale';

describe('NetworkUrlParams', () => {
  const { onpopstate } = window;
  const { history } = global;
  let result: RenderResult;
  let props: NetworkUrlParamsProps;
  let getParamsSpy: jest.SpyInstance<Record<string, string | string[]>, []>;
  const params = { to: 'to', from: 'from', group: 'group', weight: 'weight' };

  beforeAll(() => {
    delete (window as any).onpopstate;
    window.onpopstate = jest.fn();
  });

  beforeEach(async () => {
    props = {
      propagateState: jest.fn(),
      params: {},
    };
    getParamsSpy = jest.spyOn(actions, 'getParams');
    result = await act(() => render(<NetworkUrlParams {...props} />));
  });

  afterEach(jest.restoreAllMocks);

  afterAll(() => {
    window.onpopstate = onpopstate;
    Object.defineProperty(global, 'history', history);
  });

  it('renders successfully', () => {
    expect(result.container.innerHTML).toBe('');
  });

  it('correctly updates history', () => {
    const pushState = jest.fn();
    Object.defineProperty(global.history, 'pushState', {
      value: pushState,
    });
    getParamsSpy.mockReturnValue({});
    result.rerender(<NetworkUrlParams {...{ ...props, params }} />);
    expect(pushState).toHaveBeenLastCalledWith({}, '', '?to=to&from=from&group=group&weight=weight');
    (window as any).onpopstate();
    expect(props.propagateState).toHaveBeenLastCalledWith({
      to: undefined,
      from: undefined,
      group: undefined,
      weight: undefined,
    });
    pushState.mockClear();
    result.rerender(<NetworkUrlParams {...{ ...props, params }} />);
    expect(pushState).not.toHaveBeenCalled();
    getParamsSpy.mockReturnValue(params);
    result.rerender(<NetworkUrlParams {...{ ...props, params: { ...params, test: 'blah' } }} />);
    expect(pushState).not.toHaveBeenCalled();
    result.unmount();
  });
});
