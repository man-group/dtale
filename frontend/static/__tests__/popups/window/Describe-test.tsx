import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';

import Describe from '../../../popups/describe/Describe';
import { RemovableError } from '../../../RemovableError';
import * as DescribeRepository from '../../../repository/DescribeRepository';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, tickUpdate } from '../../test-utils';

describe('tests for Describe component', () => {
  let result: ReactWrapper;

  beforeEach(() => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => {
      if (url === '/dtale/dtypes/1') {
        return Promise.resolve({ data: { error: 'dtypes error' } });
      }
      if (url.startsWith('/dtale/describe/2?col=col1')) {
        return Promise.resolve({ data: { error: 'describe error' } });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
  });

  const setup = async (dataId: string, settings = ''): Promise<void> => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings }, store);
    store.getState().dataId = dataId;
    buildInnerHTML({ settings });
    result = mount(
      <Provider store={store}>
        <Describe />
      </Provider>,
      { attachTo: document.getElementById('content') ?? undefined },
    );
    await act(async () => await tickUpdate(result));
    result = result.update();
  };

  afterEach(jest.restoreAllMocks);

  it('handles dtypes error', async () => {
    await setup('1');
    expect(result.find(RemovableError).text()).toBe('dtypes error');
  });

  it('handles details error', async () => {
    await setup('2');
    expect(result.find(RemovableError).text()).toBe('describe error');
  });

  it('can filter details data', async () => {
    const describeSpy = jest.spyOn(DescribeRepository, 'load');
    await setup('3', '{&quot;query&quot;:&quot;foo == 3&quot;}');
    expect(result.find('div.filtered')).toHaveLength(1);
    expect(describeSpy).toHaveBeenCalledWith('3', 'col1', true);
    await act(async () => {
      result.find('div.filtered').find('i').simulate('click');
    });
    result = result.update();
    expect(describeSpy).toHaveBeenLastCalledWith('3', 'col1', false);
  });
});
