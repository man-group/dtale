import { act, screen } from '@testing-library/react';
import axios from 'axios';
import selectEvent from 'react-select-event';

import { CreateColumnType } from '../../../popups/create/CreateColumnState';
import { validateTransformCfg } from '../../../popups/create/CreateTransform';
import reduxUtils from '../../redux-test-utils';
import { selectOption, mockT as t } from '../../test-utils';

import * as TestSupport from './CreateColumn.test.support';

describe('CreateTransform', () => {
  const spies = new TestSupport.Spies();

  afterEach(() => spies.afterEach());

  afterAll(() => spies.afterAll());

  it('builds a transform column', async () => {
    spies.setupMockImplementations();
    await spies.setupWrapper();
    await spies.clickBuilder('Transform');
    expect(screen.getByText('Transform')).toHaveClass('active');
    await selectOption(
      screen.getByText('Group By').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'col1',
    );
    await selectOption(
      screen.getByText('Col').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'col2',
    );
    await selectOption(
      screen.getByText('Aggregation').parentElement!.getElementsByClassName('Select')[0] as HTMLElement,
      'Mean',
    );
    await spies.validateCfg({
      cfg: {
        col: 'col2',
        group: ['col1'],
        agg: 'mean',
      },
      name: 'col2_transform',
      type: CreateColumnType.TRANSFORM,
    });
  });

  it('check no option messages', async () => {
    spies.setupMockImplementations();
    (axios.get as any).mockImplementation((url: string) => {
      if (url.startsWith('/dtale/dtypes')) {
        return Promise.resolve({
          data: {
            dtypes: [],
            success: true,
          },
        });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    await spies.setupWrapper();
    await spies.clickBuilder('Transform');
    const groupSelect = screen.getByText('Group By').parentElement!.getElementsByClassName('Select')[0] as HTMLElement;
    await act(async () => {
      await selectEvent.openMenu(groupSelect);
    });
    expect(screen.getByText('No columns available!')).toBeDefined();
    const colSelect = screen.getByText('Col').parentElement!.getElementsByClassName('Select')[0] as HTMLElement;
    await act(async () => {
      await selectEvent.openMenu(colSelect);
    });
    expect(screen.getByText('No columns available for the following dtypes: int, float!')).toBeDefined();
  });

  it('DataViewer: build transform cfg validation', () => {
    expect(validateTransformCfg(t, {})).toBe('Please select a group!');
    expect(validateTransformCfg(t, { group: ['col1'] })).toBe('Please select a column to transform!');
    expect(
      validateTransformCfg(t, {
        col: 'col1',
        group: ['col2'],
      }),
    ).toBe('Please select an aggregation!');
    expect(
      validateTransformCfg(t, {
        col: 'col1',
        group: ['col2'],
        agg: 'mean',
      }),
    ).toBeUndefined();
  });
});
