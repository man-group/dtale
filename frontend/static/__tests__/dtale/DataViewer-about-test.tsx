import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';

import About from '../../popups/About';
import * as GenericRepository from '../../repository/GenericRepository';
import { buildInnerHTML, tickUpdate } from '../test-utils';

const pjson: Record<string, any> = require('../../../package.json');

describe('About', () => {
  let result: ReactWrapper;
  let fetchJsonSpy: jest.SpyInstance<Promise<unknown>, [string]>;

  const build = async (): Promise<void> => {
    buildInnerHTML({ settings: '' });
    result = mount(<About />, { attachTo: document.getElementById('content') ?? undefined });
    await act(async () => await tickUpdate(result));
    result = result.update();
  };

  beforeEach(async () => {
    fetchJsonSpy = jest.spyOn(GenericRepository, 'getDataFromService');
    fetchJsonSpy.mockResolvedValue(Promise.resolve({ info: { version: pjson.version } }));
  });

  afterEach(jest.restoreAllMocks);

  it('renders correctly', async () => {
    await build();
    expect(fetchJsonSpy).toHaveBeenCalled();
    expect(result.find('div.modal-body div.row').first().text()).toBe(`Your Version:${pjson.version}`);
    expect(result.find('div.modal-body div.row').at(1).text()).toBe(`PyPi Version:${pjson.version}`);
    expect(result.find('div.dtale-alert')).toHaveLength(0);
  });

  it('handles expired version', async () => {
    fetchJsonSpy.mockResolvedValue(Promise.resolve({ info: { version: '999.0.0' } }));
    await build();
    expect(fetchJsonSpy).toHaveBeenCalled();
    expect(result.find('div.modal-body div.row').first().text()).toBe(`Your Version:${pjson.version}`);
    expect(result.find('div.modal-body div.row').at(1).text()).toBe('PyPi Version:999.0.0');
    expect(result.find('div.dtale-alert').length).toBe(1);
  });
});
