import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { ActionMeta, default as Select } from 'react-select';
import ReactSlider from 'react-slider';

import { BaseCreateComponentProps, CreateColumnType } from '../../../popups/create/CreateColumnState';
import { default as CreateWinsorize, validateWinsorizeCfg } from '../../../popups/create/CreateWinsorize';
import { mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateWinsorize', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    result = await spies.clickBuilder(result, 'Winsorize');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  const findWinsorize = (): ReactWrapper<BaseCreateComponentProps, Record<string, any>> => result.find(CreateWinsorize);

  it('builds a winsorize column', async () => {
    expect(findWinsorize()).toHaveLength(1);
    await act(async () => {
      findWinsorize()
        .find(Select)
        .first()
        .props()
        .onChange?.({ value: 'col1' }, {} as ActionMeta<unknown>);
    });
    result = result.update();
    await act(async () => {
      findWinsorize()
        .find(Select)
        .first()
        .props()
        .onChange?.(null, {} as ActionMeta<unknown>);
    });
    result = result.update();
    await act(async () => {
      findWinsorize()
        .find(Select)
        .first()
        .props()
        .onChange?.({ value: 'col1' }, {} as ActionMeta<unknown>);
    });
    result = result.update();
    await act(async () => {
      findWinsorize()
        .find(Select)
        .last()
        .props()
        .onChange?.([{ value: 'col2' }], {} as ActionMeta<unknown>);
    });
    result = result.update();
    await act(async () => {
      findWinsorize().find(ReactSlider).prop('onAfterChange')([20, 80]);
    });
    result = result.update();
    await act(async () => {
      findWinsorize().find(ReactSlider).prop('onAfterChange')([20, 80]);
    });
    result = result.update();
    await act(async () => {
      findWinsorize()
        .find('div.form-group')
        .at(2)
        .find('input')
        .first()
        .simulate('change', { target: { value: '30' } });
    });
    result = result.update();
    await act(async () => {
      findWinsorize()
        .find('div.form-group')
        .at(2)
        .find('input')
        .last()
        .simulate('change', { target: { value: '70' } });
    });
    result = result.update();
    await act(async () => {
      findWinsorize().find('i').first().simulate('click');
    });
    result = result.update();
    await act(async () => {
      findWinsorize().find('i').last().simulate('click');
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: {
        col: 'col1',
        group: ['col2'],
        limits: [0.3, 0.3],
        inclusive: [false, false],
      },
      name: 'col1_winsorize',
      type: CreateColumnType.WINSORIZE,
    });
  });

  it('validates configuration', () => {
    expect(validateWinsorizeCfg(t, { limits: [10, 90], inclusive: [true, true] })).toBe(
      'Please select a column to winsorize!',
    );
    expect(
      validateWinsorizeCfg(t, {
        col: 'col1',
        group: ['col2'],
        limits: [0.1, 0.1],
        inclusive: [true, false],
      }),
    ).toBeUndefined();
  });
});
