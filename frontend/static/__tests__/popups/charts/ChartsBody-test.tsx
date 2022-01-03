import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';

import { default as ChartsBody, ChartsBodyProps } from '../../../popups/charts/ChartsBody';
import reduxUtils from '../../redux-test-utils';
import { mockChartJS, mockD3Cloud, tickUpdate } from '../../test-utils';

describe('ChartsBody tests', () => {
  let result: ReactWrapper<ChartsBodyProps>;
  const props: ChartsBodyProps = {
    columns: [],
    visible: true,
    y: [],
    group: [],
    rollingWindow: '4',
  };

  beforeAll(() => {
    mockChartJS();
    mockD3Cloud();
  });

  beforeEach(() => {
    const axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation((url: string) => {
      if (url.startsWith('chart-data-error-test1')) {
        return Promise.resolve({ data: { data: {} } });
      }
      if (url.startsWith('chart-data-error-test2')) {
        return Promise.resolve({ data: { error: 'Error test.' } });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
  });

  afterAll(jest.restoreAllMocks);

  const mountChart = async (overrides: Partial<ChartsBodyProps>): Promise<void> => {
    result = mount(<ChartsBody {...{ ...props, ...overrides }} />, {
      attachTo: document.getElementById('content') ?? undefined,
    });
    await act(async () => await tickUpdate(result));
    result = result.update();
  };

  it('handles missing data', async () => {
    await mountChart({ url: 'chart-data-error-test1' });
    expect(result.html().includes('No data found.')).toBe(true);
  });

  it('handles errors', async () => {
    await mountChart({ url: 'chart-data-error-test2' });
    expect(result.html().includes('Error test.')).toBe(true);
    result.setProps({ visible: false });
    expect(result.html()).toBeNull();
  });
});
