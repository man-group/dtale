import { act, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { Provider, useDispatch } from 'react-redux';
import { Store } from 'redux';
import { default as configureStore } from 'redux-mock-store';

import { default as FilterDisplay, FilterDisplayProps, Queries } from '../../../dtale/info/FilterDisplay';
import { InfoMenuType } from '../../../dtale/info/infoUtils';
import * as serverState from '../../../dtale/serverStateManagement';
import * as menuUtils from '../../../menuUtils';
import { ActionType } from '../../../redux/actions/AppActions';
import * as settingsActions from '../../../redux/actions/settings';
import { AppState, SidePanelType } from '../../../redux/state/AppState';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

const useDispatchMock = useDispatch as jest.Mock;

describe('FilterDisplay', () => {
  let wrapper: Element;
  const mockStore = configureStore();
  let store: Store;
  let props: FilterDisplayProps;
  let updateSettingsSpy: jest.SpyInstance;
  let openMenuSpy: jest.SpyInstance;
  let dropFilteredRowsSpy: jest.SpyInstance;
  let moveFiltersToCustomSpy: jest.SpyInstance;
  let updateSettingsActionSpy: jest.SpyInstance;
  const mockDispatch = jest.fn();

  const buildMock = async (appState?: Partial<AppState>): Promise<void> => {
    store = mockStore({
      dataId: '1',
      settings: {
        columnFilters: { foo: { query: 'foo == 1' } },
        outlierFilters: { foo: { query: 'foo == 1' } },
        predefinedFilters: { foo: { value: 1, active: true } },
        query: 'query',
      },
      predefinedFilters: [
        {
          name: 'custom_foo',
          column: 'foo',
          description: 'foo',
          inputType: 'input',
        },
      ],
      hideDropRows: false,
      ...appState,
    });
    props = {
      menuOpen: undefined,
      setMenuOpen: jest.fn(),
    };
    wrapper = await act(async (): Promise<Element> => {
      return render(
        <Provider store={store}>
          <FilterDisplay {...props} />
        </Provider>,
      ).container;
    });
  };

  beforeEach(() => {
    useDispatchMock.mockImplementation(() => mockDispatch);
    updateSettingsSpy = jest.spyOn(serverState, 'updateSettings');
    updateSettingsSpy.mockResolvedValue(Promise.resolve({ success: true }));
    dropFilteredRowsSpy = jest.spyOn(serverState, 'dropFilteredRows');
    dropFilteredRowsSpy.mockResolvedValue(Promise.resolve({ success: true }));
    moveFiltersToCustomSpy = jest.spyOn(serverState, 'moveFiltersToCustom');
    moveFiltersToCustomSpy.mockResolvedValue(Promise.resolve({ settings: {} }));
    openMenuSpy = jest.spyOn(menuUtils, 'openMenu');
    openMenuSpy.mockImplementation(() => undefined);
    updateSettingsActionSpy = jest.spyOn(settingsActions, 'updateSettings');
  });

  afterEach(jest.resetAllMocks);

  afterAll(jest.restoreAllMocks);

  it('displays all queries', async () => {
    await buildMock();
    const filterMenuToggle = wrapper.querySelector('div.filter-menu-toggle')!;
    const filterLink = filterMenuToggle.querySelector('span.pointer')!;
    expect(filterLink.textContent).toBe('foo == 1 and foo == 1 and f...');
    expect(screen.queryAllByTestId('query-entry')).toHaveLength(2);
  });

  it('clears all filters on clear-all', async () => {
    await buildMock();
    const cancels = [...wrapper.getElementsByClassName('ico-cancel')];
    await act(() => {
      fireEvent.click(cancels[cancels.length - 1]);
    });
    expect(updateSettingsSpy).toHaveBeenLastCalledWith(
      {
        query: '',
        columnFilters: {},
        outlierFilters: {},
        predefinedFilters: { foo: { value: 1, active: false } },
        invertFilter: false,
      },
      '1',
    );
  });

  it('clears individual filters on click', async () => {
    await buildMock();
    const filterMenuToggle = wrapper.querySelector('div.filter-menu-toggle')!;
    const buttons = [...filterMenuToggle.getElementsByTagName('button')];
    for (const button of buttons) {
      await act(async () => {
        await fireEvent.click(button);
      });
    }
    expect(updateSettingsSpy).toHaveBeenCalledWith({ query: '' }, '1');
    expect(updateSettingsSpy).toHaveBeenCalledWith({ predefinedFilters: { foo: { value: 1, active: false } } }, '1');
  });

  it('displays menu', async () => {
    await buildMock();
    await act(async () => {
      await fireEvent.click(wrapper.querySelector('div.filter-menu-toggle')!);
    });
    expect(openMenuSpy).toHaveBeenCalled();
    openMenuSpy.mock.calls[0][0]();
    expect(props.setMenuOpen).toHaveBeenLastCalledWith(InfoMenuType.FILTER);
    openMenuSpy.mock.calls[0][1]();
    expect(props.setMenuOpen).toHaveBeenLastCalledWith(undefined);
  });

  it('correctly calls drop-filtered-rows', async () => {
    await buildMock();
    await act(async () => {
      await fireEvent.click(wrapper.querySelector('i.fas.fa-eraser')!);
    });
    expect(dropFilteredRowsSpy).toHaveBeenCalledTimes(1);
    expect(updateSettingsActionSpy).toHaveBeenCalledWith({
      query: '',
      columnFilters: {},
      outlierFilters: {},
      predefinedFilters: { foo: { value: 1, active: false } },
      invertFilter: false,
    });
  });

  it('hides drop-filtered-rows', async () => {
    await buildMock({ hideDropRows: true });
    expect(wrapper.querySelectorAll('i.fas.fa-eraser')).toHaveLength(0);
  });

  it('correctly calls move filters to custom', async () => {
    await buildMock();
    await act(async () => {
      await fireEvent.click(wrapper.querySelector('i.fa.fa-filter')!);
    });
    expect(moveFiltersToCustomSpy).toHaveBeenCalledTimes(1);
    expect(updateSettingsActionSpy).toHaveBeenCalledWith({});
    expect(mockDispatch).toHaveBeenCalledWith({ type: ActionType.SHOW_SIDE_PANEL, view: SidePanelType.FILTER });
  });

  it('inverts filter', async () => {
    await buildMock();
    await act(async () => {
      await fireEvent.click(wrapper.querySelector('i.fas.fa-retweet')!);
    });
    expect(updateSettingsSpy).toHaveBeenCalledWith({ invertFilter: true }, '1');
  });

  it('highlight filter', async () => {
    await buildMock();
    await act(async () => {
      await fireEvent.click(wrapper.querySelector('i.fa-highlighter')!);
    });
    expect(updateSettingsSpy).toHaveBeenCalledWith({ highlightFilter: true }, '1');
  });

  describe('Queries', () => {
    let queries: Element;

    beforeEach(async () => {
      queries = await act(async (): Promise<Element> => {
        return render(
          <Provider store={store}>
            <Queries prop="columnFilters" filters={{ foo: { query: 'foo == 1' } }} />
          </Provider>,
        ).container;
      });
    });

    it('renders successfully', () => {
      expect(queries.querySelector('span.font-weight-bold')!.textContent).toBe('foo == 1');
    });

    it('clears all', async () => {
      for (const button of queries.getElementsByTagName('button')) {
        await act(async () => {
          await fireEvent.click(button);
        });
      }
      expect(updateSettingsSpy).toHaveBeenCalledWith({ columnFilters: {} }, '1');
    });
  });
});
