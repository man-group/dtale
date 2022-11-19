import { act, fireEvent, RenderResult, screen } from '@testing-library/react';

import { SaveAs } from '../../../popups/create/CreateColumnState';
import { ReplacementType, ValueConfigType } from '../../../popups/replacement/CreateReplacementState';
import { validateValueCfg } from '../../../popups/replacement/Value';
import { selectOption, mockT as t } from '../../test-utils';

import * as TestSupport from './CreateReplacement.test.support';

describe('Value', () => {
  const spies = new TestSupport.Spies();
  let result: RenderResult;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    await spies.clickBuilder('Value(s)');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  const findValueInputRow = (idx = 0): Element => result.container.querySelectorAll('div.form-group')[idx];

  it('handles value raw replacement w/ new col', async () => {
    expect(screen.getByText('Search For')).toBeDefined();
    await spies.setName('cut_col');
    await act(async () => {
      fireEvent.change(findValueInputRow(2).getElementsByTagName('input')[0], { target: { value: '3' } });
    });
    await spies.executeSave();
    await act(async () => {
      fireEvent.change(findValueInputRow(3).getElementsByTagName('input')[0], { target: { value: 'nan' } });
    });
    await act(async () => {
      fireEvent.click(findValueInputRow(3).getElementsByTagName('i')[0]);
    });
    await spies.validateCfg({
      type: ReplacementType.VALUE,
      cfg: [{ type: ValueConfigType.RAW, replace: 'nan', value: 3 }],
      col: 'col1',
      saveAs: SaveAs.NEW,
      name: 'cut_col',
    });
  });

  it('DataViewer: value agg replacement', async () => {
    await act(async () => {
      fireEvent.click(screen.getByText('Agg'));
    });
    await selectOption(findValueInputRow(3).getElementsByClassName('Select')[0] as HTMLElement, 'Median');
    await act(async () => {
      fireEvent.click(findValueInputRow(3).getElementsByTagName('i')[0]);
    });
    await spies.validateCfg({
      type: ReplacementType.VALUE,
      cfg: [{ type: ValueConfigType.AGG, value: 'nan', replace: 'median' }],
      col: 'col1',
      saveAs: SaveAs.INPLACE,
    });
  });

  it('DataViewer: value col replacement', async () => {
    await act(async () => {
      fireEvent.click(screen.getByText('Col'));
    });
    await selectOption(findValueInputRow(3).getElementsByClassName('Select')[0] as HTMLElement, 'col2');
    await act(async () => {
      fireEvent.click(findValueInputRow(3).getElementsByTagName('i')[0]);
    });
    await spies.validateCfg({
      type: ReplacementType.VALUE,
      cfg: [{ type: ValueConfigType.COL, value: 'nan', replace: 'col2' }],
      col: 'col1',
      saveAs: SaveAs.INPLACE,
    });
  });

  it('DataViewer: value cfg validation', () => {
    expect(validateValueCfg(t, [])).toBe('Please add (+) a replacement!');
  });
});
