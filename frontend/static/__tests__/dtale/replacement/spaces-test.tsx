import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';

import { SaveAs } from '../../../popups/create/CreateColumnState';
import { BaseReplacementComponentProps, ReplacementType } from '../../../popups/replacement/CreateReplacementState';
import Spaces from '../../../popups/replacement/Spaces';

import * as TestSupport from './CreateReplacement.test.support';

describe('Spaces', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeEach(async () => {
    spies.setupMockImplementations();
    spies.useSelectorSpy.mockReturnValue({
      dataId: '1',
      chartData: { visible: true, propagateState: spies.propagateStateSpy, selectedCol: 'col3' },
    });
    result = await spies.setupWrapper();
    result = await spies.clickBuilder(result, 'Spaces Only');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  const findSpaces = (): ReactWrapper<BaseReplacementComponentProps, Record<string, any>> => result.find(Spaces);

  it('handles replacement w/ new col', async () => {
    expect(findSpaces()).toHaveLength(1);
    result = await spies.setName(result, 'cut_col');
    await act(async () => {
      findSpaces()
        .find('div.form-group')
        .first()
        .find('input')
        .simulate('change', { target: { value: '' } });
    });
    result = result.update();
    await spies.validateCfg(result, {
      type: ReplacementType.SPACES,
      cfg: { replace: '' },
      col: 'col3',
      saveAs: SaveAs.NEW,
      name: 'cut_col',
    });
  });

  it('replacement', async () => {
    await act(async () => {
      findSpaces()
        .find('div.form-group')
        .first()
        .find('input')
        .simulate('change', { target: { value: 'nan' } });
    });
    result = result.update();
    await spies.validateCfg(result, {
      type: ReplacementType.SPACES,
      cfg: { replace: 'nan' },
      col: 'col3',
      saveAs: SaveAs.INPLACE,
    });
  });
});
