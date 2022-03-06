import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { ActionMeta, default as Select } from 'react-select';

import {
  BaseCreateComponentProps,
  CreateColumnType,
  RollingClosedType,
  RollingWindowType,
} from '../../../popups/create/CreateColumnState';
import { default as CreateRolling, validateRollingCfg } from '../../../popups/create/CreateRolling';
import { mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateRolling', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    result = await spies.clickBuilder(result, 'Rolling');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  const findRolling = (): ReactWrapper<BaseCreateComponentProps, Record<string, any>> => result.find(CreateRolling);

  it('DataViewer: build rolling column', async () => {
    expect(findRolling()).toHaveLength(1);
    await act(async () => {
      findRolling()
        .find(Select)
        .first()
        .props()
        .onChange?.({ value: 'col1' }, {} as ActionMeta<unknown>);
    });
    result = result.update();
    await act(async () => {
      findRolling()
        .find(Select)
        .at(1)
        .props()
        .onChange?.({ value: 'mean' }, {} as ActionMeta<unknown>);
    });
    result = result.update();
    await act(async () => {
      findRolling()
        .find('div.form-group')
        .at(2)
        .find('input')
        .last()
        .simulate('change', { target: { value: '1' } });
    });
    result = result.update();
    await act(async () => {
      findRolling().find('i.ico-check-box-outline-blank').simulate('click');
    });
    result = result.update();
    await act(async () => {
      findRolling()
        .find(Select)
        .at(2)
        .props()
        .onChange?.({ value: 'col2' }, {} as ActionMeta<unknown>);
    });
    result = result.update();
    await act(async () => {
      findRolling()
        .find(Select)
        .at(3)
        .props()
        .onChange?.({ value: 'triang' }, {} as ActionMeta<unknown>);
    });
    result = result.update();
    await act(async () => {
      findRolling().find('div.form-group').last().find('button').last().simulate('click');
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: {
        col: 'col1',
        center: true,
        closed: RollingClosedType.NEITHER,
        comp: 'mean',
        min_periods: '1',
        on: 'col2',
        win_type: RollingWindowType.TRIANG,
        window: '5',
      },
      name: 'col1_rolling_mean',
      type: CreateColumnType.ROLLING,
    });
  });

  it('DataViewer: build rolling cfg validation', () => {
    expect(validateRollingCfg(t, { window: '5', center: false })).toBe('Please select a column!');
    expect(validateRollingCfg(t, { col: 'col1', window: '5', center: false })).toBe('Please select a computation!');
    expect(
      validateRollingCfg(t, {
        col: 'col1',
        comp: 'mean',
        window: '5',
        center: false,
      }),
    ).toBeUndefined();
  });
});
