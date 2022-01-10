import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { default as Select } from 'react-select';

import { CreateColumnType } from '../../../popups/create/CreateColumnState';
import {
  default as CreateExponentialSmoothing,
  validateExponentialSmoothingCfg,
} from '../../../popups/create/CreateExponentialSmoothing';
import { mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateExponentialSmoothing', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    result = await spies.clickBuilder(result, 'Exponential Smoothing');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('DataViewer: build exponential smoothing column', async () => {
    expect(result.find(CreateExponentialSmoothing)).toHaveLength(1);
    await act(async () => {
      result.find(CreateExponentialSmoothing).find(Select).first().props().onChange({ value: 'col1' });
    });
    result = result.update();
    await act(async () => {
      result
        .find(CreateExponentialSmoothing)
        .find('div.form-group')
        .at(1)
        .find('input')
        .last()
        .simulate('change', { target: { value: '0.3' } });
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: {
        col: 'col1',
        alpha: 0.3,
      },
      name: 'col1_exp_smooth',
      type: CreateColumnType.EXPONENTIAL_SMOOTHING,
    });
  });

  it('validates configuration', () => {
    expect(validateExponentialSmoothingCfg(t, { alpha: 0.0 })).toBe('Please select a column to smooth!');
    expect(
      validateExponentialSmoothingCfg(t, {
        col: 'col1',
        alpha: 0.0,
      }),
    ).toBe('Please enter a valid float for alpha!');
    expect(
      validateExponentialSmoothingCfg(t, {
        col: 'col1',
        alpha: 0.3,
      }),
    ).toBeUndefined();
  });
});
