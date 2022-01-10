import { DateInput } from '@blueprintjs/datetime';
import { ReactWrapper } from 'enzyme';
import moment from 'moment';
import { act } from 'react-dom/test-utils';

import { CreateColumnType, RandomType } from '../../../popups/create/CreateColumnState';
import { default as CreateRandom, validateRandomCfg } from '../../../popups/create/CreateRandom';
import { mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateRandom', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    result = await spies.clickBuilder(result, 'Random');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  const randomInputs = (): ReactWrapper => result.find(CreateRandom).first();

  it('builds random float column', async () => {
    expect(result.find(CreateRandom)).toHaveLength(1);
    await act(async () => {
      randomInputs()
        .find('div.form-group')
        .at(1)
        .find('input')
        .first()
        .simulate('change', { target: { value: '-2' } });
    });
    result = result.update();
    await act(async () => {
      randomInputs()
        .find('div.form-group')
        .last()
        .find('input')
        .simulate('change', { target: { value: '2' } });
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: {
        type: RandomType.FLOAT,
        low: '-2',
        high: '2',
      },
      name: 'random_col1',
      type: CreateColumnType.RANDOM,
    });
  });

  it('builds random int column', async () => {
    await act(async () => {
      randomInputs().find('div.form-group').first().find('button').at(1).simulate('click');
    });
    result = result.update();
    await act(async () => {
      randomInputs()
        .find('div.form-group')
        .at(1)
        .find('input')
        .simulate('change', { target: { value: '-2' } });
    });
    result = result.update();
    await act(async () => {
      randomInputs()
        .find('div.form-group')
        .last()
        .find('input')
        .simulate('change', { target: { value: '2' } });
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: {
        type: RandomType.INT,
        low: '-2',
        high: '2',
      },
      name: 'random_col1',
      type: CreateColumnType.RANDOM,
    });
  });

  it('builds random string column', async () => {
    await act(async () => {
      randomInputs().find('div.form-group').first().find('button').at(2).simulate('click');
    });
    result = result.update();
    await act(async () => {
      randomInputs()
        .find('div.form-group')
        .at(1)
        .find('input')
        .simulate('change', { target: { value: '5' } });
    });
    result = result.update();
    await act(async () => {
      randomInputs()
        .find('div.form-group')
        .last()
        .find('input')
        .simulate('change', { target: { value: 'abcde' } });
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: {
        type: RandomType.STRING,
        chars: 'abcde',
        length: 5,
      },
      name: 'random_col1',
      type: CreateColumnType.RANDOM,
    });
  });

  it('builds random choice column', async () => {
    await act(async () => {
      randomInputs().find('div.form-group').first().find('button').at(3).simulate('click');
    });
    result = result.update();
    await act(async () => {
      randomInputs()
        .find('div.form-group')
        .at(1)
        .find('input')
        .simulate('change', { target: { value: 'foo,bar,baz' } });
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: {
        type: RandomType.CHOICE,
        choices: 'foo,bar,baz',
      },
      name: 'random_col1',
      type: CreateColumnType.RANDOM,
    });
  });

  it('builds random bool column', async () => {
    await act(async () => {
      randomInputs().find('div.form-group').first().find('button').at(4).simulate('click');
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: {
        type: RandomType.BOOL,
      },
      name: 'random_col1',
      type: CreateColumnType.RANDOM,
    });
  });

  it('DataViewer: build random date column', async () => {
    await act(async () => {
      randomInputs().find('div.form-group').first().find('button').last().simulate('click');
    });
    result = result.update();
    await act(async () => {
      result.find(DateInput).first().props().onChange(moment('20000101').toDate());
    });
    result = result.update();
    await act(async () => {
      result.find(DateInput).last().props().onChange(moment('20000102').toDate());
    });
    result = result.update();
    await act(async () => {
      randomInputs().find('i').first().simulate('click');
    });
    result = result.update();
    await act(async () => {
      randomInputs().find('i').last().simulate('click');
    });
    result = result.update();
    await spies.validateCfg(result, {
      cfg: {
        type: RandomType.DATE,
        start: '20000101',
        end: '20000102',
        businessDay: true,
        timestamps: true,
      },
      name: 'random_col1',
      type: CreateColumnType.RANDOM,
    });
  });

  it('validates configuration', () => {
    expect(validateRandomCfg(t, { type: RandomType.INT, low: '3', high: '2' })).toBe(
      'Invalid range specification, low must be less than high!',
    );
    expect(
      validateRandomCfg(t, {
        type: RandomType.DATE,
        start: '20000101',
        end: '19991231',
        timestamps: false,
        businessDay: false,
      }),
    ).toBe('Start must be before End!');
  });
});
