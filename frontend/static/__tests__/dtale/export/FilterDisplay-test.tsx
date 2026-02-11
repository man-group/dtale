import { render, RenderResult } from '@testing-library/react';
import * as React from 'react';
import { Provider } from 'react-redux';

import FilterDisplay, { Queries } from '../../../dtale/export/FilterDisplay';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML } from '../../test-utils';

const encodeSettings = (obj: Record<string, any>): string => JSON.stringify(obj).replace(/"/g, '&quot;');

describe('export/FilterDisplay', () => {
  const setMenuOpen = jest.fn();

  const buildMock = (settingsOverrides: Record<string, any> = {}): RenderResult => {
    const settings = { ...settingsOverrides };
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: encodeSettings(settings) }, store);
    return render(
      <Provider store={store}>
        <FilterDisplay menuOpen={undefined} setMenuOpen={setMenuOpen} />
      </Provider>,
      { container: document.getElementById('content') ?? undefined },
    );
  };

  afterEach(jest.resetAllMocks);

  it('renders null when no filters', () => {
    const { container } = buildMock();
    // no filter label should appear
    expect(container.textContent).not.toContain('Filter');
  });

  it('renders single column filter', () => {
    const { container } = buildMock({
      columnFilters: { col1: { query: '`col1` > 1' } },
    });
    expect(container.textContent).toContain('Filter');
  });

  it('renders multiple filters', () => {
    const { container } = buildMock({
      columnFilters: { col1: { query: '`col1` > 1' } },
      outlierFilters: { col2: { query: '`col2` < 10' } },
      query: 'col3 == 1',
    });
    expect(container.textContent).toContain('Filter');
  });
});

describe('Queries', () => {
  it('renders filter queries', () => {
    const filters = {
      col1: { query: '`col1` > 5' },
      col2: { query: '`col2` < 10' },
    };
    const { container } = render(<Queries prop="columnFilters" filters={filters as any} />);
    expect(container.textContent).toContain('col1 > 5');
    expect(container.textContent).toContain('col2 < 10');
  });
});
