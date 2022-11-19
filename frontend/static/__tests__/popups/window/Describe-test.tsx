import { act, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';

import Describe from '../../../popups/describe/Describe';
import * as DescribeRepository from '../../../repository/DescribeRepository';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML } from '../../test-utils';

describe('tests for Describe component', () => {
  let result: Element;

  beforeEach(() => {
    (axios.get as any).mockImplementation((url: string) => {
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
    buildInnerHTML({ settings, dataId }, store);
    result = await act(
      async () =>
        render(
          <Provider store={store}>
            <Describe />
          </Provider>,
          { container: document.getElementById('content') ?? undefined },
        ).container,
    );
  };

  afterEach(jest.restoreAllMocks);

  it('handles dtypes error', async () => {
    await setup('1');
    expect(screen.getByRole('alert').textContent).toBe('dtypes error');
  });

  it('handles details error', async () => {
    await setup('2');
    expect(screen.getByRole('alert').textContent).toBe('describe error');
  });

  it('can filter details data', async () => {
    const describeSpy = jest.spyOn(DescribeRepository, 'load');
    await setup('3', '{&quot;query&quot;:&quot;foo == 3&quot;}');
    expect(result.querySelectorAll('div.filtered')).toHaveLength(1);
    expect(describeSpy).toHaveBeenCalledWith('3', 'col1', true);
    await act(async () => {
      await fireEvent.click(result.querySelector('div.filtered')!.getElementsByTagName('i')[0]);
    });
    expect(describeSpy).toHaveBeenLastCalledWith('3', 'col1', false);
  });
});
