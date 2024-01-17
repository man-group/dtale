import { act, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';
import selectEvent from 'react-select-event';

import LibrarySymbolSelector from '../../../popups/arcticdb/LibrarySymbolSelector';
import * as uploadUtils from '../../../popups/upload/uploadUtils';
import { AppActions } from '../../../redux/actions/AppActions';
import { ArcticDBPopupData, PopupType } from '../../../redux/state/AppState';
import * as ArcticDBRepository from '../../../repository/ArcticDBRepository';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, parseUrlParams, selectOption } from '../../test-utils';

const props: ArcticDBPopupData = {
  visible: true,
  type: PopupType.ARCTICDB,
  title: 'LibrarySymbolSelector Test',
};

const LIBS = ['foo', 'bar', 'baz'];
const SYMBOLS = {
  foo: ['foo1', 'foo2', 'foo3'],
  bar: ['bar1', 'bar2', 'bar3'],
  baz: ['baz1', 'baz2', 'baz3'],
};

describe('LibrarySymbolSelector tests', () => {
  let result: Element;

  const updateProps = async (chartData?: Partial<ArcticDBPopupData>): Promise<void> => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    store.dispatch(AppActions.OpenChartAction({ ...props, ...chartData }));
    if (chartData?.visible === false) {
      store.dispatch(AppActions.CloseChartAction());
    }
    result = await act(
      async () =>
        await render(
          <Provider store={store}>
            <LibrarySymbolSelector />
          </Provider>,
          {
            container: document.getElementById('content') ?? undefined,
          },
        ).container,
    );
  };

  beforeEach(async () => {
    (axios.get as any).mockImplementation((url: string) => {
      if (url.startsWith('/dtale/arcticdb/libraries')) {
        return Promise.resolve({ data: { libraries: LIBS } });
      } else if (url.startsWith('/dtale/arcticdb/foo/symbols')) {
        return Promise.resolve({ data: { symbols: SYMBOLS.foo } });
      } else if (url.startsWith('/dtale/arcticdb/bar/symbols')) {
        return Promise.resolve({ data: { symbols: SYMBOLS.bar, async: true } });
      } else if (url.startsWith('/dtale/arcticdb/bar/async-symbols')) {
        return Promise.resolve({ data: [{ label: 'bar4', value: 'bar4' }] });
      } else if (url.startsWith('/dtale/arcticdb/baz/symbols')) {
        return Promise.resolve({ data: { symbols: SYMBOLS.baz } });
      } else if (url.startsWith('/dtale/arcticdb/load-description')) {
        const params = parseUrlParams(url);
        return Promise.resolve({
          data: {
            description: 'Test Description',
            library: params.library,
            symbol: params.symbol,
          },
        });
      } else if (url.startsWith('/dtale/arcticdb/load-symbol')) {
        return Promise.resolve({ data: { data_id: '2' } });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
  });

  afterEach(jest.restoreAllMocks);

  it('LibrarySymbolSelector rendering libraries & symbols', async () => {
    await updateProps();
    const librarySelect = document.body.getElementsByClassName('Select')[0] as HTMLElement;
    await act(async () => {
      await selectEvent.openMenu(librarySelect);
    });
    expect([...document.body.getElementsByClassName('Select__option')].map((o) => o.textContent)).toEqual(LIBS);
    await selectOption(librarySelect, 'foo');
    const symbolSelect = (): HTMLElement => document.body.getElementsByClassName('Select')[1] as HTMLElement;
    await act(async () => {
      await selectEvent.openMenu(symbolSelect());
    });
    expect([...document.body.getElementsByClassName('Select__option')].map((o) => o.textContent)).toEqual(SYMBOLS.foo);
    await selectOption(symbolSelect(), 'foo1');
    const loadDescriptionSpy = jest.spyOn(ArcticDBRepository, 'loadDescription');
    await act(async () => {
      await fireEvent.click(screen.getByText('View Info'));
    });
    expect(loadDescriptionSpy).toHaveBeenCalledWith('foo', 'foo1');
    expect(result.getElementsByTagName('b')[0].textContent).toBe('foo - foo1');
    expect(result.getElementsByTagName('pre')[0].textContent).toBe('Test Description');

    const librariesSpy = jest.spyOn(ArcticDBRepository, 'libraries');
    await act(async () => {
      await fireEvent.click(result.querySelectorAll('i.ico-refresh')[0]!);
    });
    expect(librariesSpy).toHaveBeenCalledWith(true);
    const symbolsSpy = jest.spyOn(ArcticDBRepository, 'symbols');
    await act(async () => {
      await fireEvent.click(result.querySelectorAll('i.ico-refresh')[1]!);
    });
    expect(symbolsSpy).toHaveBeenCalledWith('foo', true);

    await selectOption(symbolSelect(), 'foo1');
    const loadSymbolSpy = jest.spyOn(ArcticDBRepository, 'loadSymbol');
    const jumpToDatasetSpy = jest.spyOn(uploadUtils, 'jumpToDataset');
    jumpToDatasetSpy.mockImplementation(() => Promise.resolve(undefined));

    await act(async () => {
      await fireEvent.click(screen.getByText('Load'));
    });
    expect(loadSymbolSpy).toHaveBeenCalledWith('foo', 'foo1');
    expect(jumpToDatasetSpy).toHaveBeenLastCalledWith('2');
  });

  it('LibrarySymbolSelector rendering async symbols', async () => {
    await updateProps();
    const librarySelect = document.body.getElementsByClassName('Select')[0] as HTMLElement;
    await selectOption(librarySelect, 'bar');
    const symbolSelect = (): HTMLElement => document.body.getElementsByClassName('Select')[1] as HTMLElement;
    const asyncSymbolsSpy = jest.spyOn(ArcticDBRepository, 'asyncSymbols');
    await act(async () => {
      fireEvent.change(symbolSelect().getElementsByTagName('input')[0], { target: { value: 'b' } });
    });
    expect(asyncSymbolsSpy).toHaveBeenCalledWith('bar', 'b');
  });
});
