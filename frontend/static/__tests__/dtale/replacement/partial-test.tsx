import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';

import { SaveAs } from '../../../popups/create/CreateColumnState';
import CreateReplace, { CreateReplaceProps } from '../../../popups/create/CreateReplace';
import * as ReplaceUtils from '../../../popups/create/CreateReplace';
import { ReplacementType } from '../../../popups/replacement/CreateReplacementState';

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
    result = await spies.clickBuilder(result, 'Replace Substring');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  const findReplace = (): ReactWrapper<CreateReplaceProps, Record<string, any>> => result.find(CreateReplace);

  it('handles partial replacement w/ new col', async () => {
    expect(findReplace()).toHaveLength(1);
    result = await spies.setName(result, 'cut_col');
    await act(async () => {
      findReplace()
        .find('div.form-group')
        .first()
        .find('input')
        .simulate('change', { target: { value: 'nan' } });
    });
    result = result.update();
    await act(async () => {
      findReplace()
        .find('div.form-group')
        .at(1)
        .find('input')
        .simulate('change', { target: { value: 'nan' } });
    });
    result = result.update();
    await spies.validateCfg(result, {
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
      findReplace()
        .find('div.form-group')
        .first()
        .find('input')
        .simulate('change', { target: { value: 'A' } });
    });
    result = result.update();
    await act(async () => {
      findReplace().find('div.form-group').at(2).find('i').simulate('click');
    });
    result = result.update();
    await act(async () => {
      findReplace().find('div.form-group').last().find('i').simulate('click');
    });
    result = result.update();
    await act(async () => {
      findReplace()
        .find('div.form-group')
        .at(1)
        .find('input')
        .simulate('change', { target: { value: 'nan' } });
    });
    result = result.update();
    result = await spies.executeSave(result);
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
