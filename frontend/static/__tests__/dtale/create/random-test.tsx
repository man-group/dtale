import { act, fireEvent, screen } from '@testing-library/react';

import { CreateColumnType, RandomType } from '../../../popups/create/CreateColumnState';
import { validateRandomCfg } from '../../../popups/create/CreateRandom';
import { mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateRandom', () => {
  const spies = new TestSupport.Spies();
  let result: Element;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    await spies.clickBuilder('Random');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('builds random float column', async () => {
    expect(screen.getByText('Random')).toHaveClass('active');
    await act(async () => {
      await fireEvent.change(result.getElementsByTagName('input')[1], { target: { value: '-2' } });
    });
    await act(async () => {
      await fireEvent.change(result.getElementsByTagName('input')[2], { target: { value: '2' } });
    });
    await spies.validateCfg({
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
      await fireEvent.click(screen.getByText('Int'));
    });
    await act(async () => {
      await fireEvent.change(result.getElementsByTagName('input')[1], { target: { value: '-2' } });
    });
    await act(async () => {
      await fireEvent.change(result.getElementsByTagName('input')[2], { target: { value: '2' } });
    });
    await spies.validateCfg({
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
      await fireEvent.click(screen.queryAllByText('String')[1]);
    });
    await act(async () => {
      await fireEvent.change(result.getElementsByTagName('input')[1], { target: { value: '5' } });
    });
    await act(async () => {
      await fireEvent.change(result.getElementsByTagName('input')[2], { target: { value: 'abcde' } });
    });
    await spies.validateCfg({
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
      await fireEvent.click(screen.getByText('Choice'));
    });
    await act(async () => {
      await fireEvent.change(result.getElementsByTagName('input')[1], { target: { value: 'foo,bar,baz' } });
    });
    await spies.validateCfg({
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
      await fireEvent.click(screen.getByText('Bool'));
    });
    await spies.validateCfg({
      cfg: {
        type: RandomType.BOOL,
      },
      name: 'random_col1',
      type: CreateColumnType.RANDOM,
    });
  });

  it('DataViewer: build random date column', async () => {
    await act(async () => {
      await fireEvent.click(screen.getByText('Date'));
    });
    await act(async () => {
      await fireEvent.click(result.getElementsByClassName('bp4-popover2-target')[0]);
    });
    await act(async () => {
      await fireEvent.change(result.getElementsByClassName('bp4-input')[0], { target: { value: '20000101' } });
    });
    await act(async () => {
      await fireEvent.change(result.getElementsByClassName('bp4-input')[1], { target: { value: '20000102' } });
    });
    await act(async () => {
      await fireEvent.click(result.getElementsByClassName('ico-check-box-outline-blank')[0]);
    });
    await act(async () => {
      await fireEvent.click(result.getElementsByClassName('ico-check-box-outline-blank')[0]);
    });
    await spies.validateCfg({
      cfg: {
        type: RandomType.DATE,
        start: '2000-01-01',
        end: '2000-01-02',
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
