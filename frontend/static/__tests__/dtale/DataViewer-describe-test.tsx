import { act, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import * as React from 'react';
import { Provider } from 'react-redux';
import selectEvent from 'react-select-event';

import Describe from '../../popups/describe/Describe';
import { ASC_PATH, DESC_PATH } from '../../popups/describe/DtypesGrid';
import { ActionType } from '../../redux/actions/AppActions';
import * as GenericRepository from '../../repository/GenericRepository';
import DimensionsHelper from '../DimensionsHelper';
import reduxUtils from '../redux-test-utils';
import { buildInnerHTML, selectOption } from '../test-utils';

describe('DataViewer tests', () => {
  let container: Element;
  let postSpy: jest.SpyInstance<Promise<unknown>, [string, unknown]>;
  const dimensions = new DimensionsHelper({
    offsetWidth: 500,
    offsetHeight: 500,
    innerWidth: 1205,
    innerHeight: 775,
  });

  const { close, opener } = window;

  beforeAll(() => {
    dimensions.beforeAll();
    delete window.opener;
    delete (window as any).close;
    window.opener = { location: { reload: jest.fn() } };
    window.close = jest.fn();
  });

  beforeEach(async () => {
    (axios.get as any).mockImplementation((url: string) => Promise.resolve({ data: reduxUtils.urlFetcher(url) }));

    postSpy = jest.spyOn(GenericRepository, 'postDataToService');
    postSpy.mockResolvedValue(Promise.resolve({ data: {} }));

    const store = reduxUtils.createDtaleStore();
    store.dispatch({ type: ActionType.OPEN_CHART, chartData: { visible: true } });
    buildInnerHTML({ settings: '' }, store);
    await act(() => {
      const result = render(
        <Provider store={store}>
          <Describe />
        </Provider>,
        { container: document.getElementById('content') ?? undefined },
      );
      container = result.container;
    });
  });

  afterEach(jest.restoreAllMocks);

  afterAll(() => {
    dimensions.afterAll();
    window.opener = opener;
    window.close = close;
  });

  const dtypesGrid = (): Element => container.getElementsByClassName('dtypes')[0];
  const details = (): Element => screen.getByTestId('details');
  const clickHeaderSort = async (colIndex: number): Promise<void> => {
    await act(async () => {
      fireEvent.click(dtypesGrid().querySelectorAll("div[role='columnheader']")[colIndex]);
    });
  };

  it('DataViewer: describe base grid operations', async () => {
    await act(async () => {
      const buttons = [...details().getElementsByTagName('button')];
      fireEvent.click(buttons.find((btn) => btn.textContent === 'Diffs')!);
    });
    expect(
      [...details().querySelectorAll('span.font-weight-bold')].find(
        (span) => span.textContent === 'Sequential Difference Values (top 100 most common):',
      ),
    ).toBeDefined();
    await act(async () => {
      const buttons = [...details().getElementsByTagName('button')];
      fireEvent.click(buttons.find((btn) => btn.textContent === 'Outliers')!);
    });
    expect(screen.queryAllByTestId('details-charts')).toHaveLength(1);
    expect(
      [...details().querySelectorAll('span.font-weight-bold')].find(
        (span) => span.textContent === '3 Outliers Found (top 100):',
      ),
    ).toBeDefined();
    await act(async () => {
      const anchors = details().getElementsByTagName('a');
      fireEvent.click(anchors[anchors.length - 1]);
    });
    expect(dtypesGrid().querySelectorAll("div[role='row']").length).toBe(5);
    const headers = (): HTMLCollectionOf<Element> => document.body.getElementsByClassName('headerCell');
    const header = (name: string): Element => [...headers()].find((h) => h.textContent === name)!;
    expect(header('#').getElementsByTagName('path')[0]?.getAttribute('d')).toBe(ASC_PATH);
    await clickHeaderSort(2);
    expect(header('Column Name').getElementsByTagName('path')[0]?.getAttribute('d')).toBe(ASC_PATH);
    await clickHeaderSort(2);
    expect(header('Column Name').getElementsByTagName('path')[0]?.getAttribute('d')).toBe(DESC_PATH);
    await clickHeaderSort(2);
    expect(header('Column Name').getElementsByTagName('path')[0]?.getAttribute('d')).toBeUndefined();
    await act(async () => {
      const buttons = [...screen.getByTestId('describe-filters').getElementsByTagName('button')];
      fireEvent.click(buttons.find((btn) => btn.textContent === 'Histogram')!);
    });
    expect(container.getElementsByTagName('canvas')).toHaveLength(1);
    await act(async () => {
      const buttons = [...screen.getByTestId('describe-filters').getElementsByTagName('button')];
      fireEvent.click(buttons.find((btn) => btn.textContent === 'Categories')!);
    });
    const categorySelect = (): HTMLElement =>
      screen.getByTestId('category-col').getElementsByClassName('Select')[0] as HTMLElement;
    await selectOption(categorySelect(), 'col3');
    expect(container.getElementsByTagName('canvas')).toHaveLength(1);
    await act(async () => {
      await selectEvent.clearFirst(categorySelect());
    });
    expect(container.querySelectorAll('div.missing-category')).toHaveLength(1);
  });

  it('DataViewer: showing/hiding columns from Describe popup & jumping sessions', async () => {
    const headers = (): HTMLCollectionOf<Element> => document.body.getElementsByClassName('headerCell');
    await act(async () => {
      const input = headers()[2].getElementsByTagName('input')[0];
      fireEvent.change(input, { target: { value: '1' } });
    });
    expect(dtypesGrid().querySelectorAll("div[role='row']")).toHaveLength(2);
    await act(async () => {
      fireEvent.click(dtypesGrid().querySelector("div[title='col1']")!);
    });
    expect(details().getElementsByClassName('row')[0].getElementsByTagName('span')[0].textContent).toBe('col1');
    await act(async () => {
      fireEvent.click(headers()[1].getElementsByClassName('ico-check-box')[0]);
    });
    await act(async () => {
      fireEvent.click(headers()[1].getElementsByClassName('ico-check-box-outline-blank')[0]);
    });
    await act(async () => {
      const checkBoxes = dtypesGrid().getElementsByClassName('ico-check-box');
      fireEvent.click(checkBoxes[checkBoxes.length - 1]);
    });
    await act(async () => {
      fireEvent.click(document.body.getElementsByClassName('modal-footer')[0].getElementsByTagName('button')[0]);
    });
    expect(postSpy).toBeCalledTimes(1);
    const firstPostCall = postSpy.mock.calls[0];
    expect(firstPostCall[0]).toBe('/dtale/update-visibility/1');
    expect((firstPostCall[1] as any).visibility).toBe('{"col1":false,"col2":true,"col3":true,"col4":true}');
  });
});
