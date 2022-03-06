import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
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

  const buildMock = (props?: Partial<WordcloudBodyProps>): ReactWrapper => {
    const result = mount(
      <WordcloudBody {...{ chartType: { value: 'wordcloud' }, data: { min: {}, max: {} }, height: 400, ...props }} />,
      {
        attachTo: document.getElementById('content') ?? undefined,
      },
    );
    return result.update();
  };

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('WordcloudBody missing data', () => {
    const result = buildMock();
    expect(result.html()).toBe('<div class="row"></div>');
  });

  it('WordcloudBody invalid chartType type', () => {
    const result = buildMock({ chartType: { value: 'bar' } });
    expect(result.html()).toBeNull();
  });

  it('WordcloudBody missing yProp data', () => {
    const result = buildMock({ y: [{ value: 'foo' }], data: { min: {}, max: {}, data: { bar: { foo2: [1, 2, 3] } } } });
    expect(result.html()).toBe('<div class="row"></div>');
  });
});
