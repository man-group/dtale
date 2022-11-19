import { act, fireEvent, RenderResult, screen } from '@testing-library/react';

import { SaveAs } from '../../../popups/create/CreateColumnState';
import * as ReplaceUtils from '../../../popups/create/CreateReplace';
import { ReplacementType } from '../../../popups/replacement/CreateReplacementState';

import * as TestSupport from './CreateReplacement.test.support';

describe('Strings', () => {
  const spies = new TestSupport.Spies();
  let result: RenderResult;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper({ selectedCol: 'col3' });
    await spies.clickBuilder('Replace Substring');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('handles partial replacement w/ new col', async () => {
    expect(screen.getByText('Replacement')).toBeDefined();
    await spies.setName('cut_col');
    await act(async () => {
      await fireEvent.change(result.container.getElementsByTagName('input')[1], { target: { value: 'nan' } });
    });
    await act(async () => {
      await fireEvent.change(result.container.getElementsByTagName('input')[2], { target: { value: 'nan' } });
    });
    await spies.validateCfg({
      type: ReplacementType.PARTIAL,
      cfg: { search: 'nan', replacement: 'nan', col: 'col3', caseSensitive: false, regex: false },
      col: 'col3',
      saveAs: SaveAs.NEW,
      name: 'cut_col',
    });
  });

  it('handles partial replacement', async () => {
    const validationSpy = jest.spyOn(ReplaceUtils, 'validateReplaceCfg');
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
      search: 'A',
      replacement: 'nan',
      col: 'col3',
      caseSensitive: true,
      regex: true,
    });
    validationSpy.mockRestore();
  });
});
