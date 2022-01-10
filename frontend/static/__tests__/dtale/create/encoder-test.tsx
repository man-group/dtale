import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { default as Select } from 'react-select';

import { CreateColumnType, EncoderAlgoType } from '../../../popups/create/CreateColumnState';
import { default as CreateEncoder, validateEncoderCfg } from '../../../popups/create/CreateEncoder';
import { BaseOption } from '../../../redux/state/AppState';
import { mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateEncoder', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    result = await spies.clickBuilder(result, 'Encoder');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  const selects = (): ReactWrapper => result.find(CreateEncoder).find(Select);

  it('builds encoder column', async () => {
    expect(result.find(CreateEncoder)).toHaveLength(1);
    await act(async () => {
      (selects().at(1).prop('onChange') as (option: BaseOption<string>) => void)?.({ value: 'col1' });
    });
    result = result.update();
    await act(async () => {
      (selects().first().prop('onChange') as (option: BaseOption<string>) => void)?.({
        value: EncoderAlgoType.ONE_HOT,
      });
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: { algo: EncoderAlgoType.ONE_HOT, col: 'col1', n: undefined },
      name: 'col1_one_hot',
      type: CreateColumnType.ENCODER,
    });
    await act(async () => {
      (selects().first().prop('onChange') as (option: BaseOption<string>) => void)?.({
        value: EncoderAlgoType.ORDINAL,
      });
    });
    result = result.update();
    await act(async () => {
      (selects().first().prop('onChange') as (option: BaseOption<string>) => void)?.({
        value: EncoderAlgoType.FEATURE_HASHER,
      });
    });
    result = result.update();
    await act(async () => {
      result
        .find(CreateEncoder)
        .find('div.form-group')
        .last()
        .find('input')
        .simulate('change', { target: { value: '4' } });
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: {
        col: 'col1',
        algo: EncoderAlgoType.FEATURE_HASHER,
        n: '4',
      },
      name: 'col1_feature_hasher',
      type: CreateColumnType.ENCODER,
    });
  });

  it('validates configuration', () => {
    expect(validateEncoderCfg(t, { algo: EncoderAlgoType.FEATURE_HASHER })).toBe('Please select a column!');
    expect(validateEncoderCfg(t, { col: 'col1', algo: EncoderAlgoType.FEATURE_HASHER, n: '0' })).toBe(
      'Features must be an integer greater than zero!',
    );
    expect(validateEncoderCfg(t, { col: 'col1', algo: EncoderAlgoType.ORDINAL })).toBeUndefined();
  });
});
