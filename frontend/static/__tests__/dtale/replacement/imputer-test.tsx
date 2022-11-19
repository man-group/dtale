import { act, fireEvent, RenderResult, screen } from '@testing-library/react';

import { SaveAs } from '../../../popups/create/CreateColumnState';
import { ImputerType } from '../../../popups/replacement/CreateReplacementState';

import * as TestSupport from './CreateReplacement.test.support';

describe('Imputer', () => {
  const spies = new TestSupport.Spies();
  let result: RenderResult;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    await spies.clickBuilder('Scikit-Learn Imputer');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  const changeType = async (type = 'Iterative'): Promise<void> => {
    await act(async () => {
      await fireEvent.click(screen.getByText(type));
    });
  };

  it('handles imputer iterative replacement w/ new col', async () => {
    expect(screen.getByTestId('imputer-type')).toBeDefined();
    await spies.setName('cut_col');
    await changeType();
    await spies.validateCfg({
      cfg: { type: ImputerType.ITERATIVE },
      col: 'col1',
      name: 'cut_col',
      saveAs: SaveAs.NEW,
    });
  });

  it('handles imputer knn replacement', async () => {
    await changeType('KNN');
    await act(async () => {
      fireEvent.change(result.container.getElementsByTagName('input')[0], { target: { value: '3' } });
    });
    await spies.validateCfg({
      cfg: { type: ImputerType.KNN, nNeighbors: 3 },
      col: 'col1',
      saveAs: SaveAs.INPLACE,
    });
  });

  it('DataViewer: imputer simple replacement', async () => {
    await changeType('Simple');
    await spies.validateCfg({ cfg: { type: ImputerType.SIMPLE }, col: 'col1', saveAs: SaveAs.INPLACE });
  });
});
