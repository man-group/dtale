import { act, fireEvent, screen } from '@testing-library/react';

import { CreateColumnType, EncoderAlgoType } from '../../../popups/create/CreateColumnState';
import { validateEncoderCfg } from '../../../popups/create/CreateEncoder';
import { selectOption, mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateEncoder', () => {
  const spies = new TestSupport.Spies();
  let result: Element;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    await spies.clickBuilder('Encoder');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('builds encoder column', async () => {
    expect(screen.queryAllByText('Encoder')[0]).toHaveClass('active');
    await selectOption(result.getElementsByClassName('Select')[0] as HTMLElement, 'OneHotEncoder');
    await selectOption(result.getElementsByClassName('Select')[1] as HTMLElement, 'col1');
    await spies.validateCfg({
      cfg: { algo: EncoderAlgoType.ONE_HOT, col: 'col1', n: undefined },
      name: 'col1_one_hot',
      type: CreateColumnType.ENCODER,
    });
    await selectOption(result.getElementsByClassName('Select')[0] as HTMLElement, 'OrdinalEncoder');
    await selectOption(result.getElementsByClassName('Select')[0] as HTMLElement, 'FeatureHasher');
    await act(async () => {
      const inputs = [...result.getElementsByTagName('input')];
      await fireEvent.change(inputs[inputs.length - 1], { target: { value: '4' } });
    });
    await spies.validateCfg({
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
