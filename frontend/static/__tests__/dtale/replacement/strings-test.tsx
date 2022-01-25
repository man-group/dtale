import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';

import { SaveAs } from '../../../popups/create/CreateColumnState';
import { ReplacementType, StringsConfig } from '../../../popups/replacement/CreateReplacementState';
import Strings, * as StringsUtils from '../../../popups/replacement/Strings';
import { RemovableError } from '../../../RemovableError';
import { mockT as t } from '../../test-utils';

import * as TestSupport from './CreateReplacement.test.support';

describe('Strings', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeEach(async () => {
    spies.setupMockImplementations();
    spies.useSelectorSpy.mockReturnValue({
      dataId: '1',
      chartData: { visible: true, propagateState: spies.propagateStateSpy, selectedCol: 'col3' },
    });
    result = await spies.setupWrapper();
    result = await spies.clickBuilder(result, 'Contains Char/Substring');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  const findStrings = (): ReactWrapper => result.find(Strings);

  it('handles strings replacement w/ new col', async () => {
    expect(findStrings()).toHaveLength(1);
    result = await spies.setName(result, 'cut_col');
    await act(async () => {
      findStrings()
        .find('div.form-group')
        .first()
        .find('input')
        .simulate('change', { target: { value: 'nan' } });
    });
    result = result.update();
    await act(async () => {
      findStrings()
        .find('div.form-group')
        .last()
        .find('input')
        .simulate('change', { target: { value: 'nan' } });
    });
    result = result.update();
    await spies.validateCfg(result, {
      type: ReplacementType.STRINGS,
      cfg: { value: 'nan', replace: 'nan', isChar: false, ignoreCase: false },
      col: 'col3',
      saveAs: SaveAs.NEW,
      name: 'cut_col',
    });
  });

  it('handles strings replacement', async () => {
    const validationSpy = jest.spyOn(StringsUtils, 'validateStringsCfg');
    await act(async () => {
      findStrings()
        .find('div.form-group')
        .first()
        .find('input')
        .simulate('change', { target: { value: 'A' } });
    });
    result = result.update();
    await act(async () => {
      findStrings().find('div.form-group').at(1).find('i').simulate('click');
    });
    result = result.update();
    await act(async () => {
      findStrings().find('div.form-group').at(2).find('i').simulate('click');
    });
    result = result.update();
    await act(async () => {
      findStrings()
        .find('div.form-group')
        .last()
        .find('input')
        .simulate('change', { target: { value: 'nan' } });
    });
    result = result.update();
    result = await spies.executeSave(result);
    expect(validationSpy).toHaveBeenLastCalledWith(expect.any(Function), {
      value: 'A',
      isChar: true,
      ignoreCase: true,
      replace: 'nan',
    });
    validationSpy.mockRestore();
  });

  it('handles string replacement w/ new invalid col', async () => {
    result = await spies.setName(result, 'error');
    await act(async () => {
      findStrings()
        .find('div.form-group')
        .first()
        .find('input')
        .simulate('change', { target: { value: 'nan' } });
    });
    result = result.update();
    result = await spies.executeSave(result);
    expect(result.find(RemovableError)).toHaveLength(1);
  });

  it('validates configuration', () => {
    let cfg: StringsConfig = { isChar: false, ignoreCase: false };
    expect(StringsUtils.validateStringsCfg(t, cfg)).toBe('Please enter a character or substring!');
    cfg = { ...cfg, value: 'A' };
    expect(StringsUtils.validateStringsCfg(t, cfg)).toBe('Please enter a replacement value!');
  });
});
