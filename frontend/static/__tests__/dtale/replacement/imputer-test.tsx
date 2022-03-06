import { ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';

import { SaveAs } from '../../../popups/create/CreateColumnState';
import { BaseReplacementComponentProps, ImputerType } from '../../../popups/replacement/CreateReplacementState';
import Imputer from '../../../popups/replacement/Imputer';

import * as TestSupport from './CreateReplacement.test.support';

describe('Imputer', () => {
  const spies = new TestSupport.Spies();
  let result: ReactWrapper;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    result = await spies.clickBuilder(result, 'Scikit-Learn Imputer');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  const findImputer = (): ReactWrapper<BaseReplacementComponentProps, Record<string, any>> => result.find(Imputer);
  const findImputerInputRow = (idx = 0): ReactWrapper => findImputer().find('div.form-group').at(idx);
  const changeType = async (idx = 0): Promise<ReactWrapper> => {
    await act(async () => {
      findImputerInputRow().find('button').at(idx).simulate('click');
    });
    return result.update();
  };

  it('handles imputer iterative replacement w/ new col', async () => {
    expect(findImputer()).toHaveLength(1);
    result = await spies.setName(result, 'cut_col');
    result = await changeType();
    await spies.validateCfg(result, {
      cfg: { type: ImputerType.ITERATIVE },
      col: 'col1',
      name: 'cut_col',
      saveAs: SaveAs.NEW,
    });
  });

  it('handles imputer knn replacement', async () => {
    result = await changeType(1);
    findImputerInputRow(1)
      .find('input')
      .simulate('change', { target: { value: '3' } });
    await spies.validateCfg(result, {
      cfg: { type: ImputerType.KNN, nNeighbors: 3 },
      col: 'col1',
      saveAs: SaveAs.INPLACE,
    });
  });

  it('DataViewer: imputer simple replacement', async () => {
    result = await changeType(2);
    await spies.executeSave(result);
    await spies.validateCfg(result, { cfg: { type: ImputerType.SIMPLE }, col: 'col1', saveAs: SaveAs.INPLACE });
  });
});
