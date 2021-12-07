import { mount, ReactWrapper } from 'enzyme';
import React from 'react';

import * as fetcher from '../../fetcher';
import About from '../../popups/About';
import { buildInnerHTML } from '../test-utils';

const pjson: Record<string, any> = require('../../../package.json');

describe('About', () => {
  let result: ReactWrapper;
  let fetchJsonSpy: jest.SpyInstance<void, [url: string, callback?: (data: Record<string, any>) => void]>;

  beforeEach(async () => {
    fetchJsonSpy = jest.spyOn(fetcher, 'fetchJson');
    fetchJsonSpy.mockImplementation(() => undefined);
    buildInnerHTML({ settings: '' });
    result = mount(<About />, { attachTo: document.getElementById('content') ?? undefined });
  });

  afterEach(jest.restoreAllMocks);

  it('renders correctly', async () => {
    expect(fetchJsonSpy).toHaveBeenCalled();
    fetchJsonSpy.mock.calls[0][1]!({ info: { version: pjson.version } });
    result.update();
    expect(result.find('div.modal-body div.row').first().text()).toBe(`Your Version:${pjson.version}`);
    expect(result.find('div.modal-body div.row').at(1).text()).toBe(`PyPi Version:${pjson.version}`);
    expect(result.find('div.dtale-alert')).toHaveLength(0);
  });

  it('handles expired version', async () => {
    expect(fetchJsonSpy).toHaveBeenCalled();
    fetchJsonSpy.mock.calls[0][1]!({ info: { version: '999.0.0' } });
    result.update();
    expect(result.find('div.modal-body div.row').first().text()).toBe(`Your Version:${pjson.version}`);
    expect(result.find('div.modal-body div.row').at(1).text()).toBe('PyPi Version:999.0.0');
    expect(result.find('div.dtale-alert').length).toBe(1);
  });
});
