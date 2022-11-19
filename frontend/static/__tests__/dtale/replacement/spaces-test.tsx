import { act, fireEvent, RenderResult, screen } from '@testing-library/react';

import { SaveAs } from '../../../popups/create/CreateColumnState';
import { ReplacementType } from '../../../popups/replacement/CreateReplacementState';

import * as TestSupport from './CreateReplacement.test.support';

describe('Spaces', () => {
  const spies = new TestSupport.Spies();
  let result: RenderResult;

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper({ selectedCol: 'col3' });
    await spies.clickBuilder('Spaces Only');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('handles replacement w/ new col', async () => {
    expect(screen.getByText('Replace With')).toBeDefined();
    await spies.setName('cut_col');
    await act(async () => {
      fireEvent.change(result.container.getElementsByTagName('input')[1], { target: { value: '' } });
    });
    await spies.validateCfg({
      type: ReplacementType.SPACES,
      cfg: { replace: '' },
      col: 'col3',
      saveAs: SaveAs.NEW,
      name: 'cut_col',
    });
  });

  it('replacement', async () => {
    await act(async () => {
      fireEvent.change(result.container.getElementsByTagName('input')[0], { target: { value: 'nan' } });
    });
    await spies.validateCfg({
      type: ReplacementType.SPACES,
      cfg: { replace: 'nan' },
      col: 'col3',
      saveAs: SaveAs.INPLACE,
    });
  });
});
