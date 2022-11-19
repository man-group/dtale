import { act, fireEvent, screen } from '@testing-library/react';
import axios from 'axios';

import { CreateColumnType, SimilarityAlgoType } from '../../../popups/create/CreateColumnState';
import { validateSimilarityCfg } from '../../../popups/create/CreateSimilarity';
import { mockColumnDef } from '../../mocks/MockColumnDef';
import reduxUtils from '../../redux-test-utils';
import { selectOption, mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateSimilarity', () => {
  const spies = new TestSupport.Spies();

  beforeEach(async () => {
    spies.setupMockImplementations();
    (axios.get as any).mockImplementation((url: string) => {
      if (url.startsWith('/dtale/dtypes')) {
        return Promise.resolve({
          data: {
            dtypes: [
              ...reduxUtils.DTYPES.dtypes,
              mockColumnDef({
                name: 'col5',
                index: 4,
                dtype: 'string',
              }),
            ],
            success: true,
          },
        });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    await spies.setupWrapper();
    await spies.clickBuilder('Similarity');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('builds similarity column', async () => {
    expect(screen.getByText('Similarity')).toHaveClass('active');
    const algoSelect = screen.getByText('Algorithm').parentElement!.getElementsByClassName('Select')[0] as HTMLElement;
    await selectOption(algoSelect, 'Damerau-Leveneshtein');
    await selectOption(
      screen.getByText('Left').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'col3',
    );
    await selectOption(
      screen.getByText('Right').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'col5',
    );
    await selectOption(algoSelect, 'Jaro-Winkler');
    await selectOption(algoSelect, 'Jaccard Index');
    await act(async () => {
      await fireEvent.change(screen.getByText('n-gram').parentElement!.getElementsByTagName('input')[0], {
        target: { value: '4' },
      });
    });
    await spies.validateCfg({
      cfg: {
        left: 'col3',
        right: 'col5',
        algo: SimilarityAlgoType.JACCARD,
        k: '4',
        normalized: false,
      },
      name: 'col3_col5_distance',
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
