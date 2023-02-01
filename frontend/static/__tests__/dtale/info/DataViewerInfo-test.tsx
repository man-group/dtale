import { act, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

import DataViewerInfo, { DataViewerInfoProps } from '../../../dtale/info/DataViewerInfo';
import * as serverState from '../../../dtale/serverStateManagement';
import { ActionType } from '../../../redux/actions/AppActions';
import { InstanceSettings, SortDir } from '../../../redux/state/AppState';
import { RemovableError } from '../../../RemovableError';
import * as GenericRepository from '../../../repository/GenericRepository';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML } from '../../test-utils';

describe('DataViewerInfo tests', () => {
  let store: Store;
  let props: DataViewerInfoProps;
  let postSpy: jest.SpyInstance;
  let updateSettingsSpy: jest.SpyInstance;

  beforeEach(() => {
    updateSettingsSpy = jest.spyOn(serverState, 'updateSettings');
    updateSettingsSpy.mockResolvedValue(Promise.resolve({ settings: {} }));
    postSpy = jest.spyOn(GenericRepository, 'postDataToService');
    postSpy.mockResolvedValue(Promise.resolve({ data: {} }));
  });

  afterEach(jest.restoreAllMocks);

  const buildInfo = async (
    additionalProps?: Partial<DataViewerInfoProps>,
    settings?: Partial<InstanceSettings>,
  ): Promise<Element> => {
    props = { propagateState: jest.fn(), columns: [], ...additionalProps };
    store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    if (settings) {
      store.dispatch({ type: ActionType.UPDATE_SETTINGS, settings });
    }
    return await act(() => {
      return render(
        <Provider store={store}>
          <DataViewerInfo {...props} />
        </Provider>,
        { container: document.getElementById('content') ?? undefined },
      ).container;
    });
  };

  it('DataViewerInfo rendering errors', async () => {
    await buildInfo({
      error: <RemovableError error="Error test" traceback="Traceback test" />,
    });
    expect(screen.getByRole('alert')).toBeDefined();
  });

  it('DataViewerInfo rendering hidden', async () => {
    const result = await buildInfo({ columns: [{ name: 'a', dtype: 'string', index: 0, visible: false }] });
    const cols = [...result.querySelectorAll('div.col')];
    expect(cols[cols.length - 1].textContent).toBe('Hidden:a');
  });

  it('DataViewerInfo rendering lots of hidden', async () => {
    const result = await buildInfo({
      columns: Array.from({ length: 10 }, (value: number, idx: number) => ({
        name: `test_col${idx}`,
        visible: false,
        dtype: 'string',
        index: idx,
      })),
    });
    const cols = [...result.querySelectorAll('div.col')];
    const hiddenLink = cols[cols.length - 1].querySelector('span.pointer')!;
    expect(hiddenLink.textContent).toBe('10 Columns');
    await act(async () => {
      await fireEvent.click(hiddenLink);
    });
    await act(async () => {
      await fireEvent.click(result.querySelector('div.hidden-menu-toggle')!.getElementsByTagName('button')[0]);
    });
  });

  it('DataViewerInfo rendering lots of filters', async () => {
    const result = await buildInfo(undefined, {
      query: 'foo == 1',
      columnFilters: {
        bar: { type: 'string', query: 'bar == 1' },
        baz: { type: 'string', query: 'baz == 1' },
      },
      allow_cell_edits: true,
      hide_shutdown: false,
      precision: 2,
      verticalHeaders: false,
      predefinedFilters: {},
      hide_header_editor: false,
    });
    const filterMenuToggle = result.querySelector('div.filter-menu-toggle')!;
    const filterLink = filterMenuToggle.querySelector('span.pointer')!;
    expect(filterLink.textContent).toBe('bar == 1 and baz == 1 and f...');
    await act(async () => {
      fireEvent.click(filterLink);
    });
    const buttons = [...filterMenuToggle.getElementsByTagName('button')];
    await act(async () => {
      fireEvent.click(buttons[0]);
    });
    await act(async () => {
      fireEvent.click(buttons[buttons.length - 1]);
    });
    expect(store.getState().settings).toEqual(
      expect.objectContaining({ query: '', columnFilters: { baz: { type: 'string', query: 'baz == 1' } } }),
    );
  });

  it('DataViewerInfo rendering lots of sorts', async () => {
    const result = await buildInfo(undefined, {
      sortInfo: [
        ['foo', SortDir.ASC],
        ['bar', SortDir.DESC],
        ['baz', SortDir.ASC],
      ],
      allow_cell_edits: true,
      hide_shutdown: false,
      precision: 2,
      verticalHeaders: false,
      predefinedFilters: {},
      hide_header_editor: false,
    });
    const sortMenuToggle = result.querySelector('div.sort-menu-toggle')!;
    const sortLink = sortMenuToggle.querySelector('span.pointer')!;
    expect(sortLink.textContent).toBe('foo (ASC), bar (DESC), baz (ASC)');
    await act(async () => {
      fireEvent.click(sortLink);
    });
    await act(async () => {
      fireEvent.click(sortMenuToggle.getElementsByTagName('button')[0]);
    });
    expect(store.getState().settings.sortInfo).toEqual([
      ['bar', SortDir.DESC],
      ['baz', SortDir.ASC],
    ]);
  });
});
