import { act, fireEvent, screen } from '@testing-library/react';
import selectEvent from 'react-select-event';

import { CreateColumnType } from '../../../popups/create/CreateColumnState';
import { validateWinsorizeCfg } from '../../../popups/create/CreateWinsorize';
import { FakeMouseEvent, selectOption, mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateWinsorize', () => {
  const spies = new TestSupport.Spies();
  let result: Element;

  beforeEach(async () => {
    (Element.prototype as any).getBoundingClientRect = jest.fn(() => {
      return {
        width: 0,
        height: 100,
        top: 0,
        left: 0,
        bottom: 0,
        right: 100,
      };
    });
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    await spies.clickBuilder('Winsorize');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('builds a winsorize column', async () => {
    expect(screen.getByText('Winsorize')).toHaveClass('active');
    const colSelect = screen.getByText('Col').parentElement!.getElementsByClassName('Select')[0] as HTMLElement;
    await selectOption(colSelect, 'col1');
    await act(async () => {
      await selectEvent.clearFirst(colSelect);
    });
    await selectOption(colSelect, 'col1');
    await selectOption(
      screen.getByText('Group By').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'col2',
    );
    let thumb = result.getElementsByClassName('thumb-0')[0];
    await act(async () => {
      await fireEvent(thumb, new FakeMouseEvent('mousedown', { bubbles: true, pageX: 0, pageY: 0 }));
    });
    await act(async () => {
      await fireEvent(thumb, new FakeMouseEvent('mousemove', { bubbles: true, pageX: 20, pageY: 0 }));
    });
    await act(async () => {
      await fireEvent.mouseUp(thumb);
    });
    thumb = result.getElementsByClassName('thumb-1')[0];
    await act(async () => {
      await fireEvent(thumb, new FakeMouseEvent('mousedown', { bubbles: true, pageX: 0, pageY: 0 }));
    });
    await act(async () => {
      await fireEvent(thumb, new FakeMouseEvent('mousemove', { bubbles: true, pageX: 80, pageY: 0 }));
    });
    await act(async () => {
      await fireEvent.mouseUp(thumb);
    });
    await act(async () => {
      await fireEvent.change(screen.getByTestId('winsorize-raw-min'), { target: { value: '30' } });
    });
    await act(async () => {
      await fireEvent.change(screen.getByTestId('winsorize-raw-max'), { target: { value: '70' } });
    });
    await act(async () => {
      await fireEvent.click(result.getElementsByClassName('ico-check-box')[0]);
    });
    await act(async () => {
      await fireEvent.click(result.getElementsByClassName('ico-check-box')[0]);
    });
    await spies.validateCfg({
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
