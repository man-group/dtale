import { act, fireEvent, screen } from '@testing-library/react';
import axios from 'axios';

import { validateCleaningCfg } from '../../../popups/create/CreateCleaning';
import { CaseType, CleanerType, CreateColumnType } from '../../../popups/create/CreateColumnState';
import { mockColumnDef } from '../../mocks/MockColumnDef';
import reduxUtils from '../../redux-test-utils';
import { selectOption, mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateCleaning', () => {
  const spies = new TestSupport.Spies();
  let result: Element;

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
                dtype: 'mixed-integer',
              }),
            ],
            success: true,
          },
        });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    result = await spies.setupWrapper();
    await spies.clickBuilder('Cleaning');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  const formGroups = (): NodeListOf<Element> => result.querySelectorAll('div.form-group');

  it('builds cleaning column', async () => {
    expect(screen.getByText('Function(s)')).toBeDefined();
    await act(async () => {
      await fireEvent.change(formGroups()[0].getElementsByTagName('input')[0], { target: { value: 'conv_col' } });
    });
    await selectOption(result.getElementsByClassName('Select')[0] as HTMLElement, 'col3');
    await act(async () => {
      await fireEvent.click(screen.getByText('Replace Multi-Space w/ Single-Space'));
    });
    await act(async () => {
      await fireEvent.click(screen.getByText('Drop Stop Words'));
    });
    await act(async () => {
      const inputs = [...result.getElementsByTagName('input')];
      await fireEvent.change(inputs[inputs.length - 1], { target: { value: 'foo,bar' } });
    });
    await act(async () => {
      await fireEvent.click(screen.getByText('Update Word Case'));
    });
    await act(async () => {
      await fireEvent.click(screen.getByText('Upper'));
    });

    await spies.validateCfg({
      cfg: {
        col: 'col3',
        cleaners: [
          CleanerType.HIDDEN_CHARS,
          CleanerType.DROP_MULTISPACE,
          CleanerType.STOPWORDS,
          CleanerType.UPDATE_CASE,
        ],
        caseType: CaseType.UPPER,
        stopwords: ['foo', 'bar'],
      },
      name: 'conv_col',
      type: CreateColumnType.CLEANING,
    });
  });

  it('toggles off cleaners', async () => {
    await selectOption(result.getElementsByClassName('Select')[0] as HTMLElement, 'col3');
    await act(async () => {
      await fireEvent.click(screen.getByText('Remove Hidden Characters'));
    });
    await act(async () => {
      await fireEvent.click(screen.getByText('Replace Multi-Space w/ Single-Space'));
    });
    await act(async () => {
      await fireEvent.click(screen.getByText('Remove Punctuation'));
    });
    await spies.validateCfg({
      cfg: {
        col: 'col3',
        cleaners: [CleanerType.DROP_MULTISPACE, CleanerType.DROP_PUNCTUATION],
      },
      name: 'col3_cleaned',
      type: CreateColumnType.CLEANING,
    });
  });

  it('validates configuration', () => {
    expect(validateCleaningCfg(t, { cleaners: [] })).toBe('Please select a column to clean!');
    expect(validateCleaningCfg(t, { col: 'col1', cleaners: [] })).toBe('Please apply function(s)!');
    expect(
      validateCleaningCfg(t, {
        col: 'col2',
        cleaners: [CleanerType.UPDATE_CASE],
      }),
    ).toBe('Please select a case to apply!');
    expect(
      validateCleaningCfg(t, {
        col: 'col2',
        cleaners: [CleanerType.UPDATE_CASE, CleanerType.STOPWORDS],
        caseType: CaseType.UPPER,
      }),
    ).toBe('Please enter a comma-separated string of stop words!');
    expect(
      validateCleaningCfg(t, {
        col: 'col2',
        cleaners: [CleanerType.HIDDEN_CHARS, CleanerType.UPDATE_CASE, CleanerType.STOPWORDS],
        caseType: CaseType.UPPER,
        stopwords: ['foo'],
      }),
    ).toBeUndefined();
  });
});
