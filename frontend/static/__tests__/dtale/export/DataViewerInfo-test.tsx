import { render, RenderResult } from '@testing-library/react';
import * as React from 'react';
import { Provider } from 'react-redux';

import DataViewerInfo from '../../../dtale/export/DataViewerInfo';
import { mockColumnDef } from '../../mocks/MockColumnDef';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML } from '../../test-utils';

const encodeSettings = (obj: Record<string, any>): string => JSON.stringify(obj).replace(/"/g, '&quot;');

describe('export/DataViewerInfo', () => {
  const propagateState = jest.fn();

  const buildMock = (storeOverrides: Record<string, any> = {}): RenderResult => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: encodeSettings(storeOverrides.settings ?? {}) }, store);
    return render(
      <Provider store={store}>
        <DataViewerInfo
          columns={
            storeOverrides.columns ?? [
              mockColumnDef({ name: 'dtale_index', index: 0, visible: true }),
              mockColumnDef({ name: 'col1', index: 1, dtype: 'int64', visible: true }),
              mockColumnDef({ name: 'col2', index: 2, dtype: 'float64', visible: true }),
            ]
          }
          propagateState={propagateState}
        />
      </Provider>,
      { container: document.getElementById('content') ?? undefined },
    );
  };

  afterEach(jest.resetAllMocks);

  it('renders without sort info or filters', () => {
    const { container } = buildMock();
    expect(container.innerHTML).toBeDefined();
  });

  it('renders sort info with single sort', () => {
    const { container } = buildMock({
      settings: { sortInfo: [['col1', 'ASC']] },
    });
    expect(container.textContent).toContain('Sort');
  });

  it('renders sort info with multiple sorts', () => {
    const { container } = buildMock({
      settings: {
        sortInfo: [
          ['col1', 'ASC'],
          ['col2', 'DESC'],
        ],
      },
    });
    expect(container.textContent).toContain('Sort');
  });

  it('renders hidden columns with single hidden', () => {
    const { container } = buildMock({
      columns: [
        mockColumnDef({ name: 'dtale_index', index: 0, visible: true }),
        mockColumnDef({ name: 'col1', index: 1, dtype: 'int64', visible: false }),
        mockColumnDef({ name: 'col2', index: 2, dtype: 'float64', visible: true }),
      ],
    });
    expect(container.textContent).toContain('Hidden');
    expect(container.textContent).toContain('col1');
  });

  it('renders hidden columns with multiple hidden', () => {
    const { container } = buildMock({
      columns: [
        mockColumnDef({ name: 'dtale_index', index: 0, visible: true }),
        mockColumnDef({ name: 'col1', index: 1, dtype: 'int64', visible: false }),
        mockColumnDef({ name: 'col2', index: 2, dtype: 'float64', visible: false }),
      ],
    });
    expect(container.textContent).toContain('Hidden');
  });
});
