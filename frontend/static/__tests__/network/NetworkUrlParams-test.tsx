import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';

import { NetworkUrlParams, NetworkUrlParamsProps } from '../../network/NetworkUrlParams';
import * as actions from '../../redux/actions/dtale';
import { tickUpdate } from '../test-utils';

describe('NetworkUrlParams', () => {
  const { onpopstate } = window;
  const { history } = global;
  let result: ReactWrapper<NetworkUrlParamsProps>;
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
    result = mount(<NetworkUrlParams {...props} />);

    await act(async () => await tickUpdate(result));
  });

  afterEach(jest.restoreAllMocks);

  afterAll(() => {
    window.onpopstate = onpopstate;
    Object.defineProperty(global, 'history', history);
  });

  it('renders successfully', () => {
    expect(result.html()).toBeNull();
  });

  it('correctly updates history', () => {
    const pushState = jest.fn();
    Object.defineProperty(global.history, 'pushState', {
      value: pushState,
    });
    getParamsSpy.mockReturnValue({});
    result.setProps({ params });
    expect(pushState).toHaveBeenLastCalledWith({}, '', '?to=to&from=from&group=group&weight=weight');
    (window as any).onpopstate();
    expect(props.propagateState).toHaveBeenLastCalledWith({
      to: undefined,
      from: undefined,
      group: undefined,
      weight: undefined,
    });
    pushState.mockClear();
    result.setProps({ params });
    expect(pushState).not.toHaveBeenCalled();
    getParamsSpy.mockReturnValue(params);
    result.setProps({ params: { ...params, test: 'blah' } });
    expect(pushState).not.toHaveBeenCalled();
    result.unmount();
  });
});
