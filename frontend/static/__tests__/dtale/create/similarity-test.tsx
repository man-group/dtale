import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { default as Select } from 'react-select';

import { CreateColumnType, SimilarityAlgoType } from '../../../popups/create/CreateColumnState';
import { default as CreateSimilarity, validateSimilarityCfg } from '../../../popups/create/CreateSimilarity';
import { BaseOption } from '../../../redux/state/AppState';
import { mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateSimilarity', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    result = await spies.clickBuilder(result, 'Similarity');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  const selects = (): ReactWrapper => result.find(CreateSimilarity).find(Select);

  it('builds similarity column', async () => {
    expect(result.find(CreateSimilarity)).toHaveLength(1);
    await act(async () => {
      (selects().at(1).prop('onChange') as (option: BaseOption<string>) => void)?.({ value: 'col1' });
    });
    result = result.update();
    await act(async () => {
      (selects().at(2).prop('onChange') as (option: BaseOption<string>) => void)({ value: 'col2' });
    });
    result = result.update();
    await act(async () => {
      (selects().first().prop('onChange') as (option: BaseOption<SimilarityAlgoType>) => void)({
        value: SimilarityAlgoType.DAMERAU_LEVENSHTEIN,
      });
    });
    result = result.update();
    await act(async () => {
      (selects().first().prop('onChange') as (option: BaseOption<SimilarityAlgoType>) => void)({
        value: SimilarityAlgoType.JARO_WINKLER,
      });
    });
    result = result.update();
    await act(async () => {
      (selects().first().prop('onChange') as (option: BaseOption<SimilarityAlgoType>) => void)({
        value: SimilarityAlgoType.JACCARD,
      });
    });
    result = result.update();
    await act(async () => {
      result
        .find(CreateSimilarity)
        .find('div.form-group')
        .last()
        .find('input')
        .simulate('change', { target: { value: '4' } });
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: {
        left: 'col1',
        right: 'col2',
        algo: SimilarityAlgoType.JACCARD,
        k: '4',
        normalized: false,
      },
      name: 'col1_col2_distance',
      type: CreateColumnType.SIMILARITY,
    });
  });

  it('validates configuration', () => {
    expect(validateSimilarityCfg(t, { algo: SimilarityAlgoType.JACCARD })).toBe('Please select a left column!');
    expect(validateSimilarityCfg(t, { left: 'col1', algo: SimilarityAlgoType.JACCARD })).toBe(
      'Please select a right column!',
    );
    expect(
      validateSimilarityCfg(t, {
        left: 'col1',
        right: 'col2',
        algo: SimilarityAlgoType.JACCARD,
      }),
    ).toBe('Please select a valid value for k!');
    expect(
      validateSimilarityCfg(t, {
        left: 'col1',
        right: 'col2',
        algo: SimilarityAlgoType.JACCARD,
        k: '4',
      }),
    ).toBeUndefined();
  });
});
