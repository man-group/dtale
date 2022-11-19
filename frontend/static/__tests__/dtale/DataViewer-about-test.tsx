import { act, render, screen } from '@testing-library/react';
import * as React from 'react';

import About from '../../popups/About';
import * as GenericRepository from '../../repository/GenericRepository';
import { buildInnerHTML } from '../test-utils';

const pjson: Record<string, any> = require('../../../package.json');

describe('About', () => {
  let container: Element;
  let fetchJsonSpy: jest.SpyInstance<Promise<unknown>, [string]>;

  const build = async (): Promise<void> => {
    buildInnerHTML({ settings: '' });
    await act(async () => {
      const result = render(<About />, { container: document.getElementById('content') ?? undefined });
      container = result.container;
    });
  };

  beforeEach(async () => {
    fetchJsonSpy = jest.spyOn(GenericRepository, 'getDataFromService');
    fetchJsonSpy.mockResolvedValue(Promise.resolve({ info: { version: pjson.version } }));
  });

  afterEach(jest.restoreAllMocks);

  it('renders correctly', async () => {
    await build();
    expect(fetchJsonSpy).toHaveBeenCalled();
    expect(container.querySelector('div.modal-body div.row')!.textContent).toBe(`Your Version:${pjson.version}`);
    expect(container.querySelectorAll('div.modal-body div.row')[1].textContent).toBe(`PyPi Version:${pjson.version}`);
    expect(container.querySelectorAll('div.dtale-alert')).toHaveLength(0);
  });

  it('handles expired version', async () => {
    fetchJsonSpy.mockResolvedValue(Promise.resolve({ info: { version: '999.0.0' } }));
    await build();
    expect(fetchJsonSpy).toHaveBeenCalled();
    expect(container.querySelector('div.modal-body div.row')!.textContent).toBe(`Your Version:${pjson.version}`);
    expect(container.querySelectorAll('div.modal-body div.row')[1].textContent).toBe('PyPi Version:999.0.0');
    expect(screen.getByRole('alert')).toBeDefined();
  });
});
