import { act, fireEvent, render, RenderResult, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';
import { default as configureStore } from 'redux-mock-store';

import MissingNoCharts from '../../../dtale/side/MissingNoCharts';
import * as DtypesRepository from '../../../repository/DtypesRepository';
import reduxUtils from '../../redux-test-utils';
import { selectOption } from '../../test-utils';

describe('MissingNoCharts', () => {
  let wrapper: RenderResult;
  const mockStore = configureStore();
  let store: Store;
  const openSpy = jest.fn();

  const { open } = window;

  const buildMock = async (): Promise<void> => {
    wrapper = await act(async (): Promise<RenderResult> => {
      return render(
        <Provider store={store}>
          <MissingNoCharts />
        </Provider>,
      );
    });
  };

  beforeAll(() => {
    delete (window as any).open;
    window.open = openSpy;
  });

  beforeEach(async () => {
    (axios.get as any).mockImplementation((url: string) => {
      if (url.startsWith('/dtale/dtypes/')) {
        const dtypes = reduxUtils.urlFetcher(url);
        dtypes.dtypes = [
          ...dtypes.dtypes,
          {
            name: 'col5',
            index: 4,
            dtype: 'datetime64[ns]',
            visible: true,
            unique_ct: 1,
          },
        ];
        return Promise.resolve({ data: dtypes });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    store = mockStore({ dataId: '1' });
  });

  afterEach(jest.resetAllMocks);

  afterAll(() => {
    jest.restoreAllMocks();
    window.open = open;
  });

  const img = (): HTMLCollectionOf<Element> => wrapper.container.getElementsByTagName('img');

  const clickBtn = async (index = 0): Promise<void> => {
    await act(async () => {
      fireEvent.click(wrapper.container.getElementsByTagName('button')[index]);
    });
  };

  it('renders successfully', async () => {
    await buildMock();
    expect(img()).toHaveLength(1);
    expect(
      wrapper.container.getElementsByClassName('missingno-inputs')[0].querySelector('button.active')?.innerHTML,
    ).toBe('Heatmap');
    expect(wrapper.container.getElementsByClassName('bouncer-wrapper')).toHaveLength(1);
    expect(img()[0].getAttribute('src')?.startsWith('/dtale/missingno/heatmap/1?date_index=col4&freq=BQ')).toBeTruthy();
    await clickBtn(1);
    expect(
      openSpy.mock.calls[0][0].startsWith('/dtale/missingno/heatmap/1?date_index=col4&freq=BQ&file=true'),
    ).toBeTruthy();
  });

  const updateChartType = async (chartType: string): Promise<void> => {
    const button = await screen.findByText(chartType);
    await act(async () => {
      await fireEvent.click(button);
    });
    expect(wrapper.container.getElementsByClassName('bouncer-wrapper')).toHaveLength(1);
    await act(async () => {
      await fireEvent.load(wrapper.container.getElementsByTagName('img')[0]);
    });
  };

  it('updates URLs on chart prop changes', async () => {
    await buildMock();
    await act(async () => {
      await fireEvent.load(img()[0]);
    });
    await updateChartType('Bar');
    await act(async () => {
      await fireEvent.load(img()[0]);
    });
    expect(img()[0].getAttribute('src')?.startsWith('/dtale/missingno/bar/1?date_index=col4&freq=BQ')).toBeTruthy();
    await clickBtn(1);
    expect(
      openSpy.mock.calls[0][0].startsWith('/dtale/missingno/bar/1?date_index=col4&freq=BQ&file=true'),
    ).toBeTruthy();
  });

  it('includes date col & freq in matrix chart', async () => {
    await buildMock();
    await act(async () => {
      await fireEvent.load(img()[0]);
    });
    await updateChartType('Matrix');
    await act(async () => {
      await fireEvent.load(img()[0]);
    });
    await selectOption(wrapper.container.getElementsByClassName('Select')[0] as HTMLElement, 'col5');
    await act(async () => {
      await fireEvent.load(img()[0]);
    });
    await selectOption(wrapper.container.getElementsByClassName('Select')[1] as HTMLElement, 'C - C');
    await act(async () => {
      await fireEvent.load(img()[0]);
    });
    await clickBtn();
    let urlExpected = '/dtale/missingno/matrix/1?date_index=col5&freq=C';
    expect(openSpy.mock.calls[0][0].startsWith(urlExpected)).toBeTruthy();
    await clickBtn(1);
    urlExpected = `${urlExpected}&file=true`;
    expect(openSpy.mock.calls[1][0].startsWith(urlExpected)).toBeTruthy();
  });

  it('image loading updates state', async () => {
    await buildMock();
    await act(async () => {
      await fireEvent.load(img()[0]);
    });
    expect(wrapper.container.getElementsByClassName('bouncer-wrapper')).toHaveLength(0);
  });

  it('shows error when image cannot be rendered', async () => {
    await buildMock();
    await act(async () => {
      await fireEvent.error(img()[0]);
    });
    expect(screen.findByRole('alert')).toBeDefined();
  });

  it('handles dtype loading error gracefully', async () => {
    const loadDtypesSpy = jest.spyOn(DtypesRepository, 'loadDtypes');
    loadDtypesSpy.mockResolvedValue({ error: 'dtype error', success: false, dtypes: [] });
    await buildMock();
    expect(screen.findByRole('alert')).toBeDefined();
    loadDtypesSpy.mockRestore();
  });
});
