import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { default as Select } from 'react-select';

import { OutputType, ResampleConfig } from '../../../popups/create/CreateColumnState';
import { default as Resample, validateResampleCfg } from '../../../popups/reshape/Resample';
import { ReshapeType } from '../../../popups/reshape/ReshapeState';

import * as TestSupport from './Reshape.test.support';

describe('Resample', () => {
  const { location, open, close, opener } = window;
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

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
    result = await spies.clickBuilder(result, 'Resample');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => {
    window.location = location;
    window.open = open;
    window.close = close;
    window.opener = opener;
    spies.afterAll();
  });

  const findResample = (): ReactWrapper => result.find(Resample);

  it('resamples data', async () => {
    expect(findResample()).toHaveLength(1);
    await act(async () => {
      findResample().find(Select).first().props().onChange({ value: 'col1' });
    });
    result = result.update();
    await act(async () => {
      findResample()
        .find('div.form-group.row')
        .at(2)
        .find('input')
        .first()
        .simulate('change', { target: { value: '17min' } });
    });
    result = result.update();
    await act(async () => {
      findResample().find(Select).last().props().onChange({ value: 'mean' });
    });
    result = result.update();
    await act(async () => {
      result.find('div.modal-body').find('div.row').last().find('button').last().simulate('click');
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: {
        agg: 'mean',
        columns: undefined,
        index: 'col1',
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
