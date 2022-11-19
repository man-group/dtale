import { act, render, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';

import { default as ChartsBody, ChartsBodyProps } from '../../../popups/charts/ChartsBody';
import reduxUtils from '../../redux-test-utils';
import { mockChartJS, mockD3Cloud } from '../../test-utils';

describe('ChartsBody tests', () => {
  let result: Element;
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
    (axios.get as any).mockImplementation((url: string) => {
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
    result = await act(
      () =>
        render(<ChartsBody {...{ ...props, ...overrides }} />, {
          container: document.getElementById('content') ?? undefined,
        }).container,
    );
  };

  it('handles missing data', async () => {
    await mountChart({ url: 'chart-data-error-test1' });
    expect(screen.getByText('No data found.')).toBeDefined();
  });

  it('handles errors', async () => {
    await mountChart({ url: 'chart-data-error-test2' });
    expect(screen.getByText('Error test.')).toBeDefined();
  });

  it('hides chart', async () => {
    await mountChart({ visible: false });
    expect(result.innerHTML).toBe('');
  });
});
