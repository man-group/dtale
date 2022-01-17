import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { default as Select } from 'react-select';

import { default as CreateCleaning, validateCleaningCfg } from '../../../popups/create/CreateCleaning';
import { CaseType, CleanerType, CreateColumnType } from '../../../popups/create/CreateColumnState';
import { mockColumnDef } from '../../mocks/MockColumnDef';
import reduxUtils from '../../redux-test-utils';
import { mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateCleaning', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeEach(async () => {
    spies.setupMockImplementations();
    spies.axiosGetSpy.mockImplementation((url: string) => {
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
    result = await spies.clickBuilder(result, 'Cleaning');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('builds cleaning column', async () => {
    expect(result.find(CreateCleaning)).toHaveLength(1);
    await act(async () => {
      result
        .find('div.form-group')
        .first()
        .find('input')
        .first()
        .simulate('change', { target: { value: 'conv_col' } });
    });
    result = result.update();
    await act(async () => {
      result.find(CreateCleaning).find(Select).first().props().onChange({ value: 'col1' });
    });
    result = result.update();
    await act(async () => {
      result.find(CreateCleaning).find('div.form-group').at(1).find('button').first().simulate('click');
    });
    result = result.update();
    await act(async () => {
      result
        .find(CreateCleaning)
        .find('div.form-group')
        .at(1)
        .find('button')
        .findWhere((btn) => btn.text() === 'Drop Stop Words')
        .first()
        .simulate('click');
    });
    result = result.update();
    await act(async () => {
      result
        .find(CreateCleaning)
        .find('div.form-group')
        .last()
        .find('input')
        .simulate('change', { target: { value: 'foo,bar' } });
    });
    result = result.update();
    await act(async () => {
      result
        .find(CreateCleaning)
        .find('div.form-group')
        .at(1)
        .find('button')
        .findWhere((btn) => btn.text() === 'Update Word Case')
        .first()
        .simulate('click');
    });
    result = result.update();
    await act(async () => {
      result.find(CreateCleaning).find('div.form-group').last().find('button').first().simulate('click');
    });
    result = result.update();

    await spies.validateCfg(result, {
      cfg: {
        col: 'col1',
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
    await act(async () => {
      result.find(CreateCleaning).find(Select).first().props().onChange({ value: 'col1' });
    });
    result = result.update();
    await act(async () => {
      result.find(CreateCleaning).find('div.form-group').at(1).find('button').first().simulate('click');
    });
    result = result.update();
    await act(async () => {
      result.find(CreateCleaning).find('div.form-group').at(1).find('button').first().simulate('click');
    });
    result = result.update();
    await act(async () => {
      result.find(CreateCleaning).find('div.form-group').at(1).find('button').at(1).simulate('click');
    });
    result = result.update();

    await spies.validateCfg(result, {
      cfg: {
        col: 'col1',
        cleaners: [CleanerType.DROP_MULTISPACE, CleanerType.DROP_PUNCTUATION],
      },
      name: 'col1_cleaned',
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
