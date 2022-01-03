import axios from 'axios';

import { tick } from './test-utils';

describe('fetcher tests', () => {
  let consoleErrorSpy, fetchSpy;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(global.console, 'error');
    consoleErrorSpy.mockImplementation(() => undefined);
    fetchSpy = jest.spyOn(axios, 'get');
    fetchSpy.mockImplementation(async () => {
      throw 'Exception Test';
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    fetchSpy.mockRestore();
  });

  it('fetcher: testing exceptions', async () => {
    const { fetchJson } = require('../fetcher');
    fetchJson('url', () => undefined);
    await tick();
    expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
  });
});
