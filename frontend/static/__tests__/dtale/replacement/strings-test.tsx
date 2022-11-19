import { act, fireEvent, RenderResult, screen } from '@testing-library/react';

import { SaveAs } from '../../../popups/create/CreateColumnState';
import { ReplacementType, StringsConfig } from '../../../popups/replacement/CreateReplacementState';
import * as StringsUtils from '../../../popups/replacement/Strings';
import { mockT as t } from '../../test-utils';

import * as TestSupport from './CreateReplacement.test.support';

describe('Strings', () => {
  const spies = new TestSupport.Spies();
  let result: RenderResult;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper({ selectedCol: 'col3' });
    await spies.clickBuilder('Contains Char/Substring');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('handles strings replacement w/ new col', async () => {
    expect(screen.getByText('Is Character?')).toBeDefined();
    await spies.setName('cut_col');
    await act(async () => {
      fireEvent.change(result.container.getElementsByTagName('input')[1], { target: { value: 'nan' } });
    });
    await act(async () => {
      fireEvent.change(result.container.getElementsByTagName('input')[2], { target: { value: 'nan' } });
    });
    await spies.validateCfg({
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
      fireEvent.change(result.container.getElementsByTagName('input')[0], { target: { value: 'A' } });
    });
    await act(async () => {
      fireEvent.click(result.container.getElementsByClassName('ico-check-box-outline-blank')[0]);
    });
    await act(async () => {
      fireEvent.click(result.container.getElementsByClassName('ico-check-box-outline-blank')[0]);
    });
    await act(async () => {
      fireEvent.change(result.container.getElementsByTagName('input')[1], { target: { value: 'nan' } });
    });
    await spies.executeSave();
    expect(validationSpy).toHaveBeenLastCalledWith(expect.any(Function), {
      value: 'A',
      isChar: true,
      ignoreCase: true,
      replace: 'nan',
    });
    validationSpy.mockRestore();
  });

  it('handles string replacement w/ new invalid col', async () => {
    await spies.setName('error');
    await act(async () => {
      fireEvent.change(result.container.getElementsByTagName('input')[1], { target: { value: 'nan' } });
    });
    await spies.executeSave();
    expect(screen.getByRole('alert')).toBeDefined();
  });

  it('validates configuration', () => {
    let cfg: StringsConfig = { isChar: false, ignoreCase: false };
    expect(StringsUtils.validateStringsCfg(t, cfg)).toBe('Please enter a character or substring!');
    cfg = { ...cfg, value: 'A' };
    expect(StringsUtils.validateStringsCfg(t, cfg)).toBe('Please enter a replacement value!');
  });
});
