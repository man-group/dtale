import { act, fireEvent, screen } from '@testing-library/react';

import { CreateColumnType, OutputType, SaveAs } from '../../../popups/create/CreateColumnState';
import { selectOption } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateResample', () => {
  const { location, open } = window;
  const spies = new TestSupport.Spies();
  let result: Element;

  beforeAll(() => {
    delete (window as any).location;
    (window as any).location = { href: 'http://localhost:8080/dtale/main/1', pathname: '/dtale/1' };
    delete (window as any).open;
    window.open = jest.fn();
  });

  beforeEach(async () => {
    spies.setupMockImplementations();
    result = await spies.setupWrapper();
    await spies.clickBuilder('Resample');
  });

  afterEach(() => spies.afterEach());

  afterAll(() => {
    spies.afterAll();
    window.location = location;
    window.open = open;
  });

  it('builds resample data', async () => {
    expect(screen.getByText('Resample')).toHaveClass('active');
    await selectOption(result.getElementsByClassName('Select')[0] as HTMLElement, 'col4');
    await act(async () => {
      await fireEvent.change(screen.getByText('Offset').parentElement!.getElementsByTagName('input')[0], {
        target: { value: '17min' },
      });
    });
    await selectOption(result.getElementsByClassName('Select')[1] as HTMLElement, 'col1');
    await selectOption(result.getElementsByClassName('Select')[1] as HTMLElement, 'col2');
    await act(async () => {
      await fireEvent.change(screen.getByText('Offset').parentElement!.getElementsByTagName('input')[0], {
        target: { value: '17min' },
      });
    });
    await selectOption(result.getElementsByClassName('Select')[2] as HTMLElement, 'Mean');
    spies.saveSpy.mockResolvedValue({ success: true, data_id: '9999' });
    await spies.validateCfg(
      {
        cfg: {
          agg: 'mean',
          columns: ['col1', 'col2'],
          freq: '17min',
          index: 'col4',
        },
        saveAs: SaveAs.NONE,
        type: CreateColumnType.RESAMPLE,
        output: OutputType.NEW,
        name: undefined,
      },
      '1',
      'reshape',
    );
    expect(window.open).toHaveBeenCalledWith('http://localhost:8080/dtale/main/9999', '_blank');
  });
});
