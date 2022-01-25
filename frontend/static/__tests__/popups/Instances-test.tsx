import axios from 'axios';
import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import * as redux from 'react-redux';

import { createMockComponent } from '../mocks/createMockComponent'; // eslint-disable-line import/order
jest.mock('../../popups/merge/DataPreview', () => ({ DataPreview: createMockComponent() }));

import Instances from '../../popups/instances/Instances';
import { AppState } from '../../redux/state/AppState';
import { RemovableError } from '../../RemovableError';
import * as GenericRepository from '../../repository/GenericRepository';
import * as InstanceRepository from '../../repository/InstanceRepository';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, tickUpdate } from '../test-utils';

describe('Instances tests', () => {
  const assignSpy = jest.fn();
  const { location } = window;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });
  let cleanupInstanceSpy: jest.SpyInstance<Promise<GenericRepository.BaseResponse | undefined>, [string]>;
  let axiosGetSpy: jest.SpyInstance;

  beforeAll(() => {
    dimensions.beforeAll();

    delete (window as any).location;
    (window as any).location = {
      href: 'http://localhost:8080',
      hostname: 'localhost',
      port: '8080',
      origin: 'http://localhost:8080',
      assign: assignSpy,
      pathname: '/dtale/main/1',
    };
  });

  beforeEach(() => {
    axiosGetSpy = jest.spyOn(axios, 'get');
    axiosGetSpy.mockImplementation(async (url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));
    cleanupInstanceSpy = jest.spyOn(InstanceRepository, 'cleanupInstance');
    buildInnerHTML();
  });

  afterEach(jest.restoreAllMocks);

  afterAll(() => {
    dimensions.afterAll();
    assignSpy.mockRestore();
    window.location = location;
  });

  const buildResult = async (overrides?: Partial<AppState>): Promise<ReactWrapper> => {
    const useSelectorSpy = jest.spyOn(redux, 'useSelector');
    useSelectorSpy.mockReturnValue({ dataId: '8080', iframe: false, ...overrides });
    buildInnerHTML({ settings: '' });
    const result = mount(<Instances />, {
      attachTo: document.getElementById('content') ?? undefined,
    });
    await act(async () => await tickUpdate(result));
    return result.update();
  };

  it('Instances rendering data', async () => {
    let result = await buildResult();
    await act(async () => {
      result.find('button.preview-btn').last().simulate('click');
    });
    result = result.update();
    expect(result.find('h4.preview-header').first().text()).toBe('8083 (2018-04-30 12:36:44)Preview');
    await act(async () => {
      result.find('button.preview-btn').first().simulate('click');
    });
    result = result.update();
    expect(result.find('h4.preview-header').first().text()).toBe('8081 - foo (2018-04-30 12:36:44)Preview');
    expect(result.find('CustomMockComponent')).toHaveLength(1);
    await act(async () => {
      result.find('div.clickable').last().simulate('click');
    });
    result = result.update();
    expect(assignSpy).toHaveBeenCalledWith('http://localhost:8080/dtale/main/8083');
    await act(async () => {
      result.find('.ico-delete').first().simulate('click');
    });
    result = result.update();
    expect(cleanupInstanceSpy).toHaveBeenCalledWith('8081');
  });

  it('Instances rendering error', async () => {
    axiosGetSpy.mockImplementation(async (url: string) => {
      if (url === '/dtale/processes') {
        return Promise.resolve({ data: { error: 'Error Test' } });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    const result = await buildResult({ dataId: '8082' });
    expect(result.find(RemovableError).props().error).toBe('Error Test');
  });
});
