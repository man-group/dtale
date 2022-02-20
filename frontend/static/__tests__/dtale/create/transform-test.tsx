import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { ActionMeta, default as Select } from 'react-select';

import { BaseCreateComponentProps, CreateColumnType } from '../../../popups/create/CreateColumnState';
import { default as CreateTransform, validateTransformCfg } from '../../../popups/create/CreateTransform';
import { mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateTransform', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    result = await spies.clickBuilder(result, 'Transform');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  const findTransform = (): ReactWrapper<BaseCreateComponentProps, Record<string, any>> => result.find(CreateTransform);

  it('builds a transform column', async () => {
    expect(findTransform()).toHaveLength(1);
    await act(async () => {
      findTransform()
        .find(Select)
        .first()
        .props()
        .onChange?.([{ value: 'col1' }], {} as ActionMeta<unknown>);
    });
    result = result.update();
    expect(findTransform().find(Select).first().props().noOptionsMessage?.({ inputValue: '' })).toBe(
      'No columns available!',
    );
    expect(findTransform().find(Select).at(1).props().noOptionsMessage?.({ inputValue: '' })).toBe(
      'No columns available for the following dtypes: int, float!',
    );
    await act(async () => {
      findTransform()
        .find(Select)
        .at(1)
        .props()
        .onChange?.({ value: 'col2' }, {} as ActionMeta<unknown>);
    });
    result = result.update();
    await act(async () => {
      findTransform()
        .find(Select)
        .last()
        .props()
        .onChange?.({ value: 'mean' }, {} as ActionMeta<unknown>);
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: {
        col: 'col2',
        group: ['col1'],
        agg: 'mean',
      },
      name: 'col2_transform',
      type: CreateColumnType.TRANSFORM,
    });
  });

  it('DataViewer: build transform cfg validation', () => {
    expect(validateTransformCfg(t, {})).toBe('Please select a group!');
    expect(validateTransformCfg(t, { group: ['col1'] })).toBe('Please select a column to transform!');
    expect(
      validateTransformCfg(t, {
        col: 'col1',
        group: ['col2'],
      }),
    ).toBe('Please select an aggregation!');
    expect(
      validateTransformCfg(t, {
        col: 'col1',
        group: ['col2'],
        agg: 'mean',
      }),
    ).toBeUndefined();
  });
});
