import { act, createEvent, fireEvent, queryAllByRole, render, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';

jest.mock('../../../dtale/side/SidePanelButtons', () => {
  const { createMockComponent } = require('../../mocks/createMockComponent');
  return { __esModule: true, default: createMockComponent() };
});

import { Correlations } from '../../../popups/correlations/Correlations';
import { ActionType } from '../../../redux/actions/AppActions';
import { CorrelationsPopupData, PopupType } from '../../../redux/state/AppState';
import * as CorrelationsRepository from '../../../repository/CorrelationsRepository';
import correlationsData from '../../data/correlations.json';
import DimensionsHelper from '../../DimensionsHelper';
import reduxUtils from '../../redux-test-utils';
import { buildInnerHTML, mockChartJS } from '../../test-utils';

const chartData: CorrelationsPopupData = {
  visible: true,
  type: PopupType.CORRELATIONS,
  title: 'Correlations Test',
  query: 'col == 3',
  col1: 'col1',
  col2: 'col3',
};

describe('Correlations tests', () => {
  let result: Element;

  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
  });

  beforeAll(() => {
    dimensions.beforeAll();
    mockChartJS();
  });

  beforeEach(async () => {
    (axios.get as any).mockImplementation((url: string) => {
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
  });

  afterEach(() => (axios.get as any).mockRestore());

  afterAll(() => {
    jest.restoreAllMocks();
    dimensions.afterAll();
  });

  const buildResult = async (overrides?: Partial<CorrelationsPopupData>): Promise<void> => {
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: '' }, store);
    store.dispatch({ type: ActionType.OPEN_CHART, chartData: { ...chartData, ...overrides } });
    result = await act(
      async () =>
        render(
          <Provider store={store}>
            <Correlations />
          </Provider>,
          {
            container: document.getElementById('content') ?? undefined,
          },
        ).container,
    );
  };

  it('Correlations rendering data', async () => {
    await buildResult();
    expect(screen.getByTestId('charts-body')).toBeDefined();
    expect(
      Array.from(result.querySelector('select.custom-select')!.getElementsByTagName('option')).map(
        (o) => o.textContent,
      ),
    ).toEqual(['col4', 'col5']);
    await act(async () => {
      await fireEvent.change(screen.getByTestId('corr-selected-date'), { target: { value: 'col5' } });
    });
    expect(axios.get).toHaveBeenLastCalledWith(expect.stringContaining('dateCol=col5'));
  });

  it('Correlations rendering data and filtering it', async () => {
    await buildResult({ col1: 'col1', col2: 'col3' });
    expect(queryAllByRole(screen.queryAllByRole('grid')[0], 'rowgroup')).toHaveLength(1);
    expect(screen.queryAllByRole('grid')[1].getElementsByClassName('headerCell')).toHaveLength(1);
  });

  it('Correlations rendering data w/ one date column', async () => {
    (axios.get as any).mockImplementation((url: string) => {
      if (url.startsWith('/dtale/correlations/')) {
        return Promise.resolve({
          data: {
            data: correlationsData.data,
            dates: [{ name: 'col4', rolling: false }],
          },
        });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    await buildResult();
    await act(async () => {
      await fireEvent.click(result.querySelectorAll('div.cell')[0]);
    });
    expect(screen.getByTestId('charts-body')).toBeDefined();
    expect(result.querySelector('select.custom-select')).toBeNull();
    expect(axios.get).toHaveBeenLastCalledWith(expect.stringContaining('dateCol=col4'));
  });

  it('Correlations rendering data w/ no date columns', async () => {
    (axios.get as any).mockImplementation((url: string) => {
      if (url.startsWith('/dtale/correlations/')) {
        return Promise.resolve({ data: { data: correlationsData.data, dates: [] } });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    await buildResult();
    expect(document.getElementById('rawScatterChart')).toBeDefined();
  });

  it('Correlations rendering rolling data', async () => {
    (axios.get as any).mockImplementation((url: string) => {
      if (url.startsWith('/dtale/correlations/')) {
        return Promise.resolve({ data: { ...correlationsData, rolling: true } });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    await buildResult();
    expect(screen.getByTestId('charts-body')).toBeDefined();
    expect(document.getElementById('rawScatterChart')).toBeDefined();
    expect(
      Array.from(result.querySelector('select.custom-select')!.getElementsByTagName('option')).map(
        (o) => o.textContent,
      ),
    ).toEqual(['col4', 'col5']);
    await act(async () => {
      await fireEvent.change(result.querySelector('select.custom-select')!, { target: { value: 'col5' } });
    });
    expect(axios.get).toHaveBeenLastCalledWith(expect.stringContaining('dateCol=col5'));
    await act(async () => {
      await fireEvent.change(screen.getByTestId('window'), { target: { value: '' } });
    });
    await act(async () => {
      await fireEvent.keyDown(screen.getByTestId('window'), { key: 'Shift' });
    });
    await act(async () => {
      await fireEvent.keyDown(screen.getByTestId('window'), { key: 'Enter' });
    });
    await act(async () => {
      await fireEvent.change(screen.getByTestId('window'), { target: { value: 'a' } });
    });
    await act(async () => {
      await fireEvent.keyDown(screen.getByTestId('window'), { key: 'Enter' });
    });
    await act(async () => {
      await fireEvent.change(screen.getByTestId('window'), { target: { value: '5' } });
    });
    await act(async () => {
      await fireEvent.keyDown(screen.getByTestId('window'), { key: 'Enter' });
    });
    expect(axios.get).toHaveBeenLastCalledWith(expect.stringContaining('window=5'));
  });

  it('Correlations w/ col1 pre-selected', async () => {
    await buildResult({ ...chartData, col2: undefined });
    expect(result.querySelector('dl.property-pair.inline')!.textContent).toMatch(/col1 vs. col2/);
  });

  it('Correlations w/ col2 pre-selected', async () => {
    await buildResult({ ...chartData, col1: undefined });
    expect(result.querySelector('dl.property-pair.inline')!.textContent).toMatch(/col1 vs. col3/);
  });

  it('Correlations w/ encoded strings', async () => {
    (axios.get as any).mockImplementation((url: string) => {
      if (url.startsWith('/dtale/correlations/')) {
        return Promise.resolve({ data: { ...correlationsData, strings: ['col5'] } });
      }
      return Promise.resolve({ data: reduxUtils.urlFetcher(url) });
    });
    await buildResult();
    const loadCorrelationsSpy = jest.spyOn(CorrelationsRepository, 'loadCorrelations');
    await act(async () => {
      await fireEvent.click(screen.getByText('Encode Strings?').parentElement!.getElementsByTagName('i')[0]);
    });
    expect(axios.get).toHaveBeenLastCalledWith(expect.stringContaining('encodeStrings=true'));
    expect(loadCorrelationsSpy).toHaveBeenCalledWith('1', true);
  });

  it('Handles grid height drag', async () => {
    await buildResult();
    const current = {
      clientX: 10,
      clientY: 10,
    };
    const dragHandle = result.getElementsByClassName('CorrDragHandle')[0];
    let myEvent = createEvent.mouseDown(dragHandle, current);
    fireEvent(dragHandle, myEvent);
    current.clientY += 100;
    myEvent = createEvent.mouseMove(dragHandle, current);
    fireEvent(dragHandle, myEvent);
    myEvent = createEvent.mouseUp(dragHandle, current);
    fireEvent(dragHandle, myEvent);
    expect(result.getElementsByClassName('ReactVirtualized__Grid')[0].parentElement!.parentElement!).toHaveStyle({
      height: '400px',
    });
  });
});
