import { render } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';

import WordcloudBody, { WordcloudBodyProps } from '../../../popups/charts/WordcloudBody';
import reduxUtils from '../../redux-test-utils';
import { mockChartJS, mockD3Cloud } from '../../test-utils';

describe('WordcloudBody tests', () => {
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

  const buildMock = (props?: Partial<WordcloudBodyProps>): Element => {
    return render(
      <WordcloudBody {...{ chartType: { value: 'wordcloud' }, data: { min: {}, max: {} }, height: 400, ...props }} />,
      {
        container: document.getElementById('content') ?? undefined,
      },
    ).container;
  };

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('WordcloudBody missing data', () => {
    const result = buildMock();
    expect(result.innerHTML).toBe('<div class="row"></div>');
  });

  it('WordcloudBody invalid chartType type', () => {
    const result = buildMock({ chartType: { value: 'bar' } });
    expect(result.innerHTML).toBe('');
  });

  it('WordcloudBody missing yProp data', () => {
    const result = buildMock({ y: [{ value: 'foo' }], data: { min: {}, max: {}, data: { bar: { foo2: [1, 2, 3] } } } });
    expect(result.innerHTML).toBe('<div class="row"></div>');
  });
});
