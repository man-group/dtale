import { act, fireEvent, RenderResult, screen } from '@testing-library/react';

import { OutputType, ResampleConfig } from '../../../popups/create/CreateColumnState';
import { validateResampleCfg } from '../../../popups/reshape/Resample';
import { ReshapeType } from '../../../popups/reshape/ReshapeState';
import { selectOption } from '../../test-utils';

import * as TestSupport from './Reshape.test.support';

describe('Resample', () => {
  const { location, open, close, opener } = window;
  const spies = new TestSupport.Spies();
  let result: RenderResult;

  beforeAll(() => {
    delete (window as any).location;
    delete (window as any).open;
    delete (window as any).opener;
    (window as any).location = {
      reload: jest.fn(),
      pathname: '/dtale/popup/reshape',
      href: '/dtale/popup/reshape',
      assign: jest.fn(),
    };
    window.open = jest.fn();
    window.close = jest.fn();
    window.opener = {
      code_popup: { code: 'test code', title: 'Test' },
      location: { assign: jest.fn(), href: '/dtale/iframe/1' },
    };
  });

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    await spies.clickBuilder('Resample');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => {
    window.location = location;
    window.open = open;
    window.close = close;
    window.opener = opener;
    spies.afterAll();
  });

  const findSelects = (): HTMLCollectionOf<Element> => result.container.getElementsByClassName('Select');

  it('resamples data', async () => {
    expect(findSelects()).toHaveLength(3);
    await selectOption(findSelects()[0] as HTMLElement, 'col4');
    await act(async () => {
      fireEvent.change(screen.getByTestId('offset-input'), { target: { value: '17min' } });
    });
    await selectOption(findSelects()[2] as HTMLElement, 'Mean');
    await act(async () => {
      fireEvent.click(screen.getByText('Override Current'));
    });
    await spies.validateCfg({
      cfg: {
        agg: 'mean',
        columns: undefined,
        index: 'col4',
        freq: '17min',
      },
      type: ReshapeType.RESAMPLE,
      output: OutputType.OVERRIDE,
    });
    expect(window.opener.location.assign).toHaveBeenCalledWith('/dtale/iframe/2');
    expect(window.close).toHaveBeenCalled();
  });

  it('validates configuration', () => {
    const cfg: ResampleConfig = { freq: '' };
    expect(validateResampleCfg(cfg)).toBe('Missing an index selection!');
    cfg.index = 'x';
    expect(validateResampleCfg(cfg)).toBe('Missing offset!');
    cfg.freq = 'x';
    expect(validateResampleCfg(cfg)).toBe('Missing aggregation!');
    cfg.agg = 'x';
    expect(validateResampleCfg(cfg)).toBeUndefined();
  });
});
