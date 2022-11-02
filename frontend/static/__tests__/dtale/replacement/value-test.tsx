import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { ActionMeta, default as Select } from 'react-select';

import { SaveAs } from '../../../popups/create/CreateColumnState';
import {
  BaseReplacementComponentProps,
  ReplacementType,
  ValueConfigType,
} from '../../../popups/replacement/CreateReplacementState';
import { validateValueCfg, default as Value } from '../../../popups/replacement/Value';
import { mockT as t } from '../../test-utils';

import * as TestSupport from './CreateReplacement.test.support';

describe('Value', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    result = await spies.clickBuilder(result, 'Value(s)');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  const findValue = (): ReactWrapper<BaseReplacementComponentProps, Record<string, any>> => result.find(Value);
  const findValueInputRow = (idx = 0): ReactWrapper => findValue().find('div.form-group').at(idx);

  it('handles value raw replacement w/ new col', async () => {
    expect(findValue()).toHaveLength(1);
    result = await spies.setName(result, 'cut_col');
    await act(async () => {
      findValueInputRow()
        .find('input')
        .simulate('change', { target: { value: '3' } });
    });
    result = result.update();
    result = await spies.executeSave(result);
    await act(async () => {
      findValueInputRow(1)
        .find('input')
        .simulate('change', { target: { value: 'nan' } });
    });
    result = result.update();
    await act(async () => {
      findValueInputRow(1).find('i').first().simulate('click');
    });
    result = result.update();
    await spies.validateCfg(result, {
      type: ReplacementType.VALUE,
      cfg: [{ type: ValueConfigType.RAW, replace: 'nan', value: 3 }],
      col: 'col1',
      saveAs: SaveAs.NEW,
      name: 'cut_col',
    });
  });

  it('DataViewer: value agg replacement', async () => {
    await act(async () => {
      findValueInputRow(1).find('button').at(1).simulate('click');
    });
    result = result.update();
    await act(async () => {
      findValueInputRow(1)
        .find(Select)
        .first()
        .props()
        .onChange?.({ value: 'median' }, {} as ActionMeta<unknown>);
    });
    result = result.update();
    await act(async () => {
      findValueInputRow(1).find('i').first().simulate('click');
    });
    result = result.update();
    await spies.validateCfg(result, {
      type: ReplacementType.VALUE,
      cfg: [{ type: ValueConfigType.AGG, value: 'nan', replace: 'median' }],
      col: 'col1',
      saveAs: SaveAs.INPLACE,
    });
  });

  it('DataViewer: value col replacement', async () => {
    await act(async () => {
      findValueInputRow(1).find('button').last().simulate('click');
    });
    result = result.update();
    await act(async () => {
      findValueInputRow(1)
        .find(Select)
        .first()
        .props()
        .onChange?.({ value: 'col2' }, {} as ActionMeta<unknown>);
    });
    result = result.update();
    await act(async () => {
      findValueInputRow(1).find('i').first().simulate('click');
    });
    result = result.update();
    await spies.validateCfg(result, {
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
